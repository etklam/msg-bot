import * as cron from 'node-cron';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';
import { telegramBot } from '../bot/bot';

const prisma = new PrismaClient();

export interface CronJob {
  name: string;
  schedule: string;
  task: () => Promise<void>;
  enabled: boolean;
}

export class CronService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private static instance: CronService;

  static getInstance(): CronService {
    if (!CronService.instance) {
      CronService.instance = new CronService();
    }
    return CronService.instance;
  }

  async start() {
    logger.info('Starting cron service...');
    
    // 註冊所有定時任務
    await this.registerJobs();
    
    logger.info('Cron service started successfully');
  }

  async stop() {
    logger.info('Stopping cron service...');
    
    for (const [name, task] of this.jobs.entries()) {
      task.stop();
      logger.info(`Stopped cron job: ${name}`);
    }
    
    this.jobs.clear();
    logger.info('Cron service stopped');
  }

  private async registerJobs() {
    const jobs: CronJob[] = [
      {
        name: 'daily-stats',
        schedule: '0 0 * * *', // 每天午夜
        task: this.sendDailyStats.bind(this),
        enabled: true
      },
      {
        name: 'cleanup-old-messages',
        schedule: '0 2 * * 0', // 每週日凌晨2點
        task: this.cleanupOldMessages.bind(this),
        enabled: true
      },
      {
        name: 'health-check',
        schedule: '*/5 * * * *', // 每5分鐘
        task: this.healthCheck.bind(this),
        enabled: true
      }
    ];

    for (const job of jobs) {
      if (job.enabled) {
        const task = cron.schedule(job.schedule, async () => {
          try {
            logger.info(`Executing cron job: ${job.name}`);
            await job.task();
            logger.info(`Completed cron job: ${job.name}`);
          } catch (error) {
            logger.error(`Error in cron job ${job.name}:`, error);
          }
        });
        
        this.jobs.set(job.name, task);
        logger.info(`Registered cron job: ${job.name} (${job.schedule})`);
      }
    }
  }

  private async sendDailyStats() {
    try {
      const stats = await prisma.cronJob.aggregate({
        _count: { id: true },
        _max: { createdAt: true },
        _min: { createdAt: true }
      });

      const message = `📊 每日統計報告
- 總定時任務: ${stats._count.id}
- 最早任務: ${stats._min.createdAt?.toLocaleDateString()}
- 最新任務: ${stats._max.createdAt?.toLocaleDateString()}`;

      // 發送給管理員
      const adminIds = process.env.ADMIN_IDS?.split(',').map(id => parseInt(id.trim())) || [];
      for (const adminId of adminIds) {
        try {
          await telegramBot.getBotInstance().telegram.sendMessage(adminId, message);
        } catch (error) {
          logger.error(`Failed to send daily stats to admin ${adminId}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error in daily stats cron job:', error);
    }
  }

  private async cleanupOldMessages() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.executionLog.deleteMany({
        where: {
          executedAt: {
            lt: thirtyDaysAgo
          }
        }
      });

      logger.info(`Cleaned up ${result.count} old execution logs`);
    } catch (error) {
      logger.error('Error in cleanup cron job:', error);
    }
  }

  private async healthCheck() {
    try {
      // 檢查資料庫連接
      await prisma.$queryRaw`SELECT 1`;
      
      // 檢查機器人狀態
      const botInfo = await telegramBot.getBotInstance().telegram.getMe();
      
      logger.info(`Health check passed - Bot: ${botInfo.username}`);
    } catch (error) {
      logger.error('Health check failed:', error);
    }
  }

  addCustomJob(job: CronJob) {
    if (this.jobs.has(job.name)) {
      throw new Error(`Cron job ${job.name} already exists`);
    }

    const task = cron.schedule(job.schedule, async () => {
      try {
        logger.info(`Executing custom cron job: ${job.name}`);
        await job.task();
        logger.info(`Completed custom cron job: ${job.name}`);
      } catch (error) {
        logger.error(`Error in custom cron job ${job.name}:`, error);
      }
    });

    this.jobs.set(job.name, task);
    logger.info(`Added custom cron job: ${job.name} (${job.schedule})`);
  }

  removeJob(name: string) {
    const task = this.jobs.get(name);
    if (task) {
      task.stop();
      this.jobs.delete(name);
      logger.info(`Removed cron job: ${name}`);
    }
  }

  getJobs() {
    return Array.from(this.jobs.keys());
  }
}

export const cronService = CronService.getInstance();
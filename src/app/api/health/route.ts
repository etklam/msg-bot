import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { telegramBot } from '@/lib/bot/bot';
import { logger } from '@/lib/utils/logger';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const health: any = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: {
        database: false,
        telegram: false,
        cron: false
      },
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };

    // 檢查資料庫連接
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = true;
    } catch (error) {
      logger.error('Database health check failed:', error);
    }

    // 檢查 Telegram Bot
    try {
      const botInfo = await telegramBot.getBotInstance().telegram.getMe();
      health.services.telegram = true;
      health.telegram = {
        username: botInfo.username,
        id: botInfo.id
      };
    } catch (error) {
      logger.error('Telegram health check failed:', error);
    }

    // 檢查 Cron 服務
    try {
      // 這裡可以添加 cron 服務的狀態檢查
      health.services.cron = true;
    } catch (error) {
      logger.error('Cron service health check failed:', error);
    }

    const isHealthy = Object.values(health.services).every(Boolean);
    
    return NextResponse.json(health, {
      status: isHealthy ? 200 : 503
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
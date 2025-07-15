// 匯出所有服務
export * from './openai';
export * from './cron.service';

// 服務初始化
import { cronService } from './cron.service';
import { logger } from '../utils/logger';

export async function initializeServices() {
  try {
    logger.info('Initializing services...');
    
    // 啟動 Cron 服務
    await cronService.start();
    
    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    throw error;
  }
}

export async function shutdownServices() {
  try {
    logger.info('Shutting down services...');
    
    // 停止 Cron 服務
    await cronService.stop();
    
    logger.info('All services shut down successfully');
  } catch (error) {
    logger.error('Error during service shutdown:', error);
    throw error;
  }
}
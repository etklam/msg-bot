#!/usr/bin/env node

import 'dotenv/config';
import { telegramBot } from './lib/bot/bot';
import { initializeServices, shutdownServices } from './lib/services';
import { botConfig, validateConfig } from './lib/config/bot.config';
import { logger } from './lib/utils/logger';

async function main() {
  try {
    // Validate configuration
    validateConfig();
    logger.info('Configuration validated successfully');

    // Initialize all services
    await initializeServices();
    
    // Start the bot
    await telegramBot.start();
    
    logger.info('🤖 Telegram Bot is running...');
    logger.info(`Mode: ${botConfig.webhookDomain ? 'Webhook' : 'Polling'}`);
    
    if (botConfig.webhookDomain) {
      logger.info(`Webhook URL: ${botConfig.webhookDomain}${botConfig.webhookPath}`);
    }
  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await shutdownServices();
  await telegramBot.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await shutdownServices();
  await telegramBot.stop();
  process.exit(0);
});

// Start the application
if (require.main === module) {
  main();
}

export { main };
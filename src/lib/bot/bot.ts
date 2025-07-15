import { Telegraf } from 'telegraf';
import { botConfig } from '../config/bot.config';
import { BotContext } from '../types/bot';
import { setupMiddleware } from './middleware';
import { setupCommands } from './commands';
import { setupErrorHandler } from './error-handler';
import { logger } from '../utils/logger';

class TelegramBot {
  private bot: Telegraf<BotContext>;
  private isRunning = false;

  constructor() {
    this.bot = new Telegraf<BotContext>(botConfig.token);
    this.initialize();
  }

  private initialize() {
    setupMiddleware(this.bot);
    setupCommands(this.bot);
    setupErrorHandler(this.bot);
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Bot is already running');
      return;
    }

    try {
      if (botConfig.webhookDomain) {
        await this.startWebhook();
      } else {
        await this.startPolling();
      }
      this.isRunning = true;
      logger.info('Bot started successfully');
    } catch (error) {
      logger.error('Failed to start bot:', error);
      throw error;
    }
  }

  async stop() {
    if (!this.isRunning) {
      logger.warn('Bot is not running');
      return;
    }

    try {
      await this.bot.stop();
      this.isRunning = false;
      logger.info('Bot stopped successfully');
    } catch (error) {
      logger.error('Failed to stop bot:', error);
      throw error;
    }
  }

  private async startWebhook() {
    if (!botConfig.webhookDomain || !botConfig.webhookPath) {
      throw new Error('Webhook configuration is incomplete');
    }

    await this.bot.launch({
      webhook: {
        domain: botConfig.webhookDomain,
        port: botConfig.port,
        path: botConfig.webhookPath,
      },
    });
  }

  private async startPolling() {
    await this.bot.launch();
  }

  getBotInstance() {
    return this.bot;
  }

  isBotRunning() {
    return this.isRunning;
  }
}

export const telegramBot = new TelegramBot();
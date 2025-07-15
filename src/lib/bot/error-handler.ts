import { Telegraf } from 'telegraf';
import { BotContext, BotError } from '../types/bot';
import { logger } from '../utils/logger';

export const setupErrorHandler = (bot: Telegraf<BotContext>) => {
  // Handle bot errors
  bot.catch(async (error: unknown, ctx: BotContext) => {
    const botError = error instanceof Error ? error : new Error(String(error));
    logger.error('Bot error occurred:', {
      error: botError.message,
      stack: botError.stack,
      user: ctx.from?.id,
      chat: ctx.chat?.id,
      updateType: ctx.updateType,
    });

    // Send user-friendly error message
    try {
      if (ctx.chat) {
        await ctx.reply(
          '❌ 抱歉，發生了一些錯誤。請稍後再試。\n\n' +
          '如果問題持續存在，請聯繫管理員。'
        );
      }
    } catch (replyError) {
      logger.error('Failed to send error message to user:', replyError);
    }
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: Error | any) => {
    logger.error('Unhandled promise rejection:', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : 'No stack trace',
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught exception:', {
      error: error.message,
      stack: error.stack,
    });
    
    // Graceful shutdown
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle SIGTERM and SIGINT for graceful shutdown
  const gracefulShutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    
    // Close bot connection
    bot.stop();
    
    // Exit after a delay to allow cleanup
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  logger.info('Error handlers setup completed');
};

// Utility function to handle specific errors
export const handleBotError = async (ctx: BotContext, error: Error, userMessage?: string) => {
  const errorMessage = userMessage || '操作失敗，請稍後再試';
  
  logger.error('Handling bot error:', {
    error: error.message,
    user: ctx.from?.id,
    chat: ctx.chat?.id,
  });

  try {
    await ctx.reply(`❌ ${errorMessage}`);
  } catch (replyError) {
    logger.error('Failed to send error message:', replyError);
  }
};

// Validation error handler
export const handleValidationError = async (ctx: BotContext, field: string) => {
  await handleBotError(
    ctx,
    new Error(`Validation failed for field: ${field}`),
    `輸入格式錯誤：${field}`
  );
};

// Rate limit error handler
export const handleRateLimitError = async (ctx: BotContext) => {
  await handleBotError(
    ctx,
    new Error('Rate limit exceeded'),
    '請求過於頻繁，請稍後再試'
  );
};

// Permission error handler
export const handlePermissionError = async (ctx: BotContext) => {
  await handleBotError(
    ctx,
    new Error('Permission denied'),
    '您沒有權限執行此操作'
  );
};
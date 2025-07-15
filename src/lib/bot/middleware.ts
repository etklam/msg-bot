import { Telegraf } from 'telegraf';
import { BotContext } from '../types/bot';
import { botConfig } from '../config/bot.config';
import { logger } from '../utils/logger';

const isAdmin = (userId: number): boolean => {
  return botConfig.adminIds.includes(userId);
};

const isAllowedChat = (chatId: number): boolean => {
  return botConfig.allowedChats.length === 0 || botConfig.allowedChats.includes(chatId);
};

export const setupMiddleware = (bot: Telegraf<BotContext>) => {
  // Session middleware
  bot.use(async (ctx, next) => {
    if (ctx.from) {
      ctx.session = {
        userId: ctx.from.id,
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        state: 'idle',
        data: {},
      };
    }
    await next();
  });

  // Logging middleware
  bot.use(async (ctx, next) => {
    const user = ctx.from;
    const chat = ctx.chat;
    
    logger.debug('Incoming update:', {
      updateId: ctx.update.update_id,
      user: user ? `${user.first_name} (@${user.username})` : 'Unknown',
      chat: chat ? `${chat.type} ${chat.id}` : 'Unknown',
      messageType: ctx.message ? Object.keys(ctx.message).find(key => 
        ['text', 'photo', 'document', 'voice', 'video', 'audio', 'sticker'].includes(key)
      ) : 'No message',
    });

    await next();
  });

  // Authorization middleware
  bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;
    const chatId = ctx.chat?.id;

    if (!userId || !chatId) {
      logger.warn('Missing user or chat ID');
      return;
    }

    // Check if user is admin (for admin commands)
    if (ctx.message && 'text' in ctx.message && ctx.message.text?.startsWith('/admin') && !isAdmin(userId)) {
      await ctx.reply('❌ 您沒有權限使用此命令');
      return;
    }

    // Check if chat is allowed
    if (!isAllowedChat(chatId)) {
      logger.warn(`Unauthorized chat: ${chatId}`);
      return;
    }

    await next();
  });

  // Rate limiting middleware (simple implementation)
  const userLastMessage = new Map<number, number>();
  const RATE_LIMIT = 1000; // 1 second

  bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) {
      await next();
      return;
    }

    const now = Date.now();
    const lastMessage = userLastMessage.get(userId);

    if (lastMessage && now - lastMessage < RATE_LIMIT) {
      logger.warn(`Rate limit exceeded for user ${userId}`);
      return;
    }

    userLastMessage.set(userId, now);
    await next();
  });

  logger.info('Middleware setup completed');
};
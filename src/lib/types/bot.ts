import { Context } from 'telegraf';

export interface BotContext extends Context {
  session?: {
    userId?: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    state?: string;
    data?: any;
  };
}

export interface CommandHandler {
  command: string;
  description: string;
  handler: (ctx: BotContext) => Promise<void>;
}

export interface MessageHandler {
  type: 'text' | 'photo' | 'document' | 'voice' | 'video' | 'audio' | 'sticker';
  handler: (ctx: BotContext) => Promise<void>;
}

export interface Middleware {
  name: string;
  handler: (ctx: BotContext, next: () => Promise<void>) => Promise<void>;
}

export interface BotError extends Error {
  code?: string;
  ctx?: BotContext;
}
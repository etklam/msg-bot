import { Telegraf } from 'telegraf';
import { BotContext } from '../types/bot';
import { botConfig } from '../config/bot.config';
import { logger } from '../utils/logger';

export const setupCommands = (bot: Telegraf<BotContext>) => {
  // Start command
  bot.start(async (ctx) => {
    const welcomeMessage = `
🤖 *歡迎使用 AI 助手 Bot！*

我可以幫助您：
• 💬 與 AI 進行對話
• 📝 總結文章和文件
• 🗣️ 語音轉文字
• 📊 分析數據

使用 /help 查看所有可用命令。
    `;
    
    await ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
    logger.info(`User ${ctx.from?.id} started the bot`);
  });

  // Help command
  bot.help(async (ctx) => {
    const helpMessage = `
📋 *可用命令列表*

基本命令：
/start - 開始使用機器人
/help - 顯示此幫助訊息
/about - 關於此機器人

AI 功能：
/chat <訊息> - 與 AI 對話
/summary - 總結回覆的訊息
/voice - 語音轉文字

管理員命令：
/admin_stats - 查看統計資料
/admin_broadcast <訊息> - 廣播訊息

💡 *提示*：直接發送訊息即可與 AI 對話！
    `;
    
    await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
  });

  // About command
  bot.command('about', async (ctx) => {
    const aboutMessage = `
🤖 *關於 AI 助手 Bot*

版本：1.0.0
功能：AI 對話、文章總結、語音處理
技術：Telegraf + OpenAI API

如有問題請聯繫管理員。
    `;
    
    await ctx.reply(aboutMessage, { parse_mode: 'Markdown' });
  });

  // Chat command
  bot.command('chat', async (ctx) => {
    const message = ctx.message;
    if (!message || !('text' in message)) return;

    const text = message.text.replace('/chat', '').trim();
    
    if (!text) {
      await ctx.reply('請提供要對話的內容，例如：\n/chat 你好，請介紹一下自己');
      return;
    }

    await ctx.reply('🤔 正在思考中...');
    
    // 這裡將整合 OpenAI 服務
    await ctx.reply(`您說：${text}\n\nAI 回覆功能即將推出...`);
  });

  // Summary command
  bot.command('summary', async (ctx) => {
    if (!ctx.message?.reply_to_message) {
      await ctx.reply('請回覆一則訊息來進行總結');
      return;
    }

    const repliedMessage = ctx.message.reply_to_message;
    let textToSummarize = '';

    if ('text' in repliedMessage) {
      textToSummarize = repliedMessage.text;
    } else if ('caption' in repliedMessage && repliedMessage.caption) {
      textToSummarize = repliedMessage.caption;
    }

    if (!textToSummarize) {
      await ctx.reply('無法總結此類型的訊息');
      return;
    }

    await ctx.reply('📝 正在總結內容...');
    
    // 這裡將整合 OpenAI 總結功能
    await ctx.reply(`原文：${textToSummarize}\n\n總結功能即將推出...`);
  });

  // Voice command
  bot.command('voice', async (ctx) => {
    await ctx.reply('🎤 語音轉文字功能即將推出！\n\n請直接發送語音訊息，我會自動轉換為文字。');
  });

  // Admin stats command
  bot.command('admin_stats', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !botConfig.adminIds.includes(userId)) {
      return;
    }

    const stats = {
      totalUsers: '統計功能開發中...',
      activeUsers: '統計功能開發中...',
      totalMessages: '統計功能開發中...',
      uptime: process.uptime(),
    };

    const statsMessage = `
📊 *管理員統計資料*

總用戶數：${stats.totalUsers}
活躍用戶：${stats.activeUsers}
總訊息數：${stats.totalMessages}
運行時間：${Math.floor(stats.uptime / 60)} 分鐘
    `;

    await ctx.reply(statsMessage, { parse_mode: 'Markdown' });
  });

  // Admin broadcast command
  bot.command('admin_broadcast', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId || !botConfig.adminIds.includes(userId)) {
      return;
    }

    const message = ctx.message;
    if (!message || !('text' in message)) return;

    const text = message.text.replace('/admin_broadcast', '').trim();
    
    if (!text) {
      await ctx.reply('請提供廣播訊息，例如：\n/admin_broadcast 大家好，這是系統公告！');
      return;
    }

    await ctx.reply(`📢 廣播訊息：\n${text}\n\n廣播功能開發中...`);
  });

  // Default message handler
  bot.on('message', async (ctx) => {
    const message = ctx.message;
    
    // Skip commands
    if ('text' in message && message.text?.startsWith('/')) {
      return;
    }

    // Handle text messages
    if ('text' in message) {
      await ctx.reply('🤖 我收到您的訊息了！AI 對話功能即將推出...');
    }
    
    // Handle voice messages
    if ('voice' in message) {
      await ctx.reply('🎤 語音訊息已收到！語音轉文字功能即將推出...');
    }
    
    // Handle photos
    if ('photo' in message) {
      await ctx.reply('📸 圖片已收到！圖片分析功能即將推出...');
    }
  });

  logger.info('Commands setup completed');
};
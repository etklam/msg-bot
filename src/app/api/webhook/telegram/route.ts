import { NextRequest, NextResponse } from 'next/server';
import { telegramBot } from '@/lib/bot/bot';
import { botConfig } from '@/lib/config/bot.config';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    // 驗證 webhook 路徑
    if (request.nextUrl.pathname !== botConfig.webhookPath) {
      return NextResponse.json(
        { error: 'Invalid webhook path' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // 處理 Telegram webhook
    await telegramBot.getBotInstance().handleUpdate(body);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error in Telegram webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // 用於 webhook 驗證
  return NextResponse.json({
    success: true,
    message: 'Telegram webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
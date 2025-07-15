export interface BotConfig {
  token: string;
  webhookDomain?: string;
  webhookPath?: string;
  port?: number;
  adminIds: number[];
  allowedChats: number[];
}

export const botConfig: BotConfig = {
  token: process.env.BOT_TOKEN || '',
  webhookDomain: process.env.WEBHOOK_DOMAIN,
  webhookPath: process.env.WEBHOOK_PATH || '/webhook',
  port: parseInt(process.env.PORT || '3000', 10),
  adminIds: process.env.ADMIN_IDS?.split(',').map(id => parseInt(id.trim(), 10)) || [],
  allowedChats: process.env.ALLOWED_CHATS?.split(',').map(id => parseInt(id.trim(), 10)) || []
};

export const validateConfig = (): boolean => {
  if (!botConfig.token) {
    throw new Error('BOT_TOKEN is required');
  }
  
  if (botConfig.webhookDomain && !botConfig.webhookPath) {
    throw new Error('WEBHOOK_PATH is required when using webhook');
  }
  
  return true;
};
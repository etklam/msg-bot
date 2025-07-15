# Telegram Bot 使用指南

## 快速開始

### 1. 環境設定

複製環境變數範例檔案：
```bash
cp .env.example .env
```

編輯 `.env` 檔案，填入必要的設定：
```bash
# 必填
BOT_TOKEN=your_telegram_bot_token_here

# 選填
WEBHOOK_DOMAIN=your_webhook_domain.com  # 使用 webhook 時需要
WEBHOOK_PATH=/webhook                   # 預設為 /webhook
PORT=3000                               # 預設為 3000
ADMIN_IDS=123456789                     # 管理員 Telegram ID
ALLOWED_CHATS=-1001234567890            # 允許的群組 ID
```

### 2. 安裝依賴

```bash
npm install
```

### 3. 啟動機器人

#### 開發模式（輪詢模式）
```bash
npm run bot:dev
```

#### 生產模式（輪詢模式）
```bash
npm run bot
```

#### 使用 Webhook（生產環境）
確保已設定 `WEBHOOK_DOMAIN` 和 `WEBHOOK_PATH`：
```bash
npm run bot
```

## 功能說明

### 基本命令
- `/start` - 開始使用機器人
- `/help` - 顯示幫助訊息
- `/about` - 顯示關於資訊

### AI 功能
- `/chat <訊息>` - 與 AI 對話
- `/summary` - 總結回覆的訊息
- `/voice` - 語音轉文字說明

### 管理員命令
- `/admin_stats` - 查看統計資料
- `/admin_broadcast <訊息>` - 廣播訊息

## 專案結構

```
src/
├── bot.ts                 # 機器人啟動檔案
├── lib/
│   ├── bot/
│   │   ├── bot.ts         # 機器人主類別
│   │   ├── commands.ts    # 命令處理器
│   │   ├── middleware.ts  # 中介軟體
│   │   └── error-handler.ts # 錯誤處理
│   ├── config/
│   │   └── bot.config.ts  # 設定檔
│   ├── types/
│   │   └── bot.ts         # TypeScript 型別定義
│   └── utils/
│       └── logger.ts      # 日誌工具
```

## 開發指南

### 新增命令
在 `src/lib/bot/commands.ts` 中添加新的命令處理器：

```typescript
bot.command('newcommand', async (ctx) => {
  await ctx.reply('這是新命令的回應');
});
```

### 新增中介軟體
在 `src/lib/bot/middleware.ts` 中添加新的中介軟體：

```typescript
bot.use(async (ctx, next) => {
  // 中介軟體邏輯
  await next();
});
```

### 錯誤處理
使用提供的錯誤處理工具：

```typescript
import { handleBotError } from './lib/bot/error-handler';

try {
  // 可能出錯的程式碼
} catch (error) {
  await handleBotError(ctx, error, '自訂錯誤訊息');
}
```

## 部署

### 使用 Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "run", "bot"]
```

### 使用 PM2
```bash
npm install -g pm2
pm2 start dist/bot.js --name telegram-bot
```

## 故障排除

### 常見問題

1. **Bot Token 錯誤**
   - 確認 `.env` 中的 `BOT_TOKEN` 正確
   - 檢查是否有多餘的空格

2. **Webhook 問題**
   - 確認網域名稱正確
   - 檢查 SSL 憑證是否有效
   - 確認防火牆允許對應端口

3. **權限問題**
   - 確認機器人有足夠的群組權限
   - 檢查 `ALLOWED_CHATS` 設定

### 日誌查看
日誌會自動輸出到控制台，包含：
- 收到的訊息
- 錯誤資訊
- 系統狀態

## 安全性建議

1. **保護 Bot Token**
   - 不要將 token 提交到版本控制
   - 使用環境變數存儲敏感資訊

2. **限制存取**
   - 使用 `ALLOWED_CHATS` 限制群組
   - 使用 `ADMIN_IDS` 限制管理員命令

3. **輸入驗證**
   - 始終驗證用戶輸入
   - 使用提供的錯誤處理機制
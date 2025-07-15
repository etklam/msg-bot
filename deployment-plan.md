# CapRover 部署計劃

## 部署概述
使用 CapRover 平台部署 Cron Telegram Bot，包含 Next.js 應用、MySQL 資料庫和獨立的 Cron Worker。

## 部署架構

```mermaid
graph TD
    A[CapRover Load Balancer] --> B[Next.js App]
    B --> C[MySQL Service]
    B --> D[Telegram Webhook]
    C --> E[Cron Worker]
    E --> F[OpenAI API]
    E --> G[Telegram Bot]
```

## 前置準備

### 1. CapRover 環境設置
```bash
# 安裝 CapRover CLI
npm install -g caprover

# 登入 CapRover
caprover login
```

### 2. 創建服務
```bash
# 創建 MySQL 服務
caprover api --method POST --path /user/apps/appDefinitions/register \
  --data '{
    "appName": "mysql-msg-bot",
    "imageName": "mysql:8.0",
    "volumes": [
      {
        "hostPath": "/var/lib/mysql-msg-bot",
        "containerPath": "/var/lib/mysql"
      }
    ],
    "envVars": [
      "MYSQL_ROOT_PASSWORD=your-secure-password",
      "MYSQL_DATABASE=msg_bot",
      "MYSQL_USER=msgbot",
      "MYSQL_PASSWORD=your-user-password"
    ],
    "ports": ["3306:3306"]
  }'
```

## 部署檔案

### 1. captain-definition
```json
{
  "schemaVersion": 2,
  "dockerfileLines": [
    "FROM node:18-alpine AS base",
    "WORKDIR /app",
    "COPY package*.json ./",
    "RUN npm ci --only=production",
    "COPY . .",
    "RUN npx prisma generate",
    "RUN npm run build",
    "EXPOSE 3000",
    "CMD [\"npm\", \"start\"]"
  ]
}
```

### 2. Dockerfile
```dockerfile
FROM node:18-alpine AS base

# 安裝系統依賴
RUN apk add --no-cache libc6-compat dumb-init

WORKDIR /app

# 複製 package 檔案
COPY package*.json ./
RUN npm ci --only=production

# 複製原始碼
COPY . .

# 生成 Prisma client
RUN npx prisma generate

# 建置 Next.js
RUN npm run build

# 生產環境
FROM node:18-alpine AS runtime
WORKDIR /app

# 安裝 dumb-init
RUN apk add --no-cache dumb-init

# 建立非 root 用戶
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 複製必要檔案
COPY --from=base /app/public ./public
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/ecosystem.config.js ./

# 設置權限
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 使用 PM2
CMD ["dumb-init", "pm2-runtime", "start", "ecosystem.config.js"]
```

### 3. PM2 配置 (ecosystem.config.js)
```javascript
module.exports = {
  apps: [
    {
      name: 'nextjs-app',
      script: 'node',
      args: 'server.js',
      cwd: '/app',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/app/logs/err.log',
      out_file: '/app/logs/out.log',
      log_file: '/app/logs/combined.log',
      time: true
    },
    {
      name: 'cron-worker',
      script: './scripts/cron-runner.js',
      cwd: '/app',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/app/logs/cron-err.log',
      out_file: '/app/logs/cron-out.log',
      log_file: '/app/logs/cron-combined.log',
      time: true
    }
  ]
};
```

### 4. 環境變數配置

#### 在 CapRover 中設置
```bash
# 資料庫
DATABASE_URL=mysql://msgbot:your-user-password@srv-captain--mysql-msg-bot:3306/msg_bot

# OpenAI
OPENAI_API_KEY=your-api-key
OPENAI_API_BASE_URL=https://your-endpoint.com/v1
OPENAI_MODEL=gpt-3.5-turbo

# Telegram
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_WEBHOOK_URL=https://your-app.your-domain.com/api/webhook/telegram

# 系統
NODE_ENV=production
PORT=3000
CRON_SECRET=your-cron-secret
```

## 部署步驟

### 1. 本地測試
```bash
# 使用 Docker Compose 測試
docker-compose up --build
```

### 2. 部署到 CapRover
```bash
# 方法一：使用 CLI
caprover deploy

# 方法二：使用腳本
npm run deploy:caprover
```

### 3. 設置 Webhook
```bash
# 部署後設置 Telegram Webhook
curl -X POST \
  https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -d "url=https://your-app.your-domain.com/api/webhook/telegram"
```

## 監控與維護

### 1. 日誌查看
```bash
# 查看應用日誌
caprover logs --app your-app-name

# 查看特定服務日誌
caprover logs --app your-app-name --service nextjs-app
caprover logs --app your-app-name --service cron-worker
```

### 2. 健康檢查
```bash
# 檢查應用狀態
curl https://your-app.your-domain.com/api/health
```

### 3. 備份策略
```bash
# 資料庫備份
caprover api --method POST --path /user/apps/appDefinitions/update \
  --data '{
    "appName": "mysql-msg-bot",
    "preDeployFunction": "backup-mysql"
  }'
```

## 故障排除

### 常見問題

1. **資料庫連接失敗**
   - 檢查 DATABASE_URL 格式
   - 確認 MySQL 服務運行正常
   - 驗證網路連接

2. **Telegram Webhook 失敗**
   - 確認 HTTPS 證書有效
   - 檢查 Webhook URL 正確性
   - 驗證 Bot Token

3. **Cron 任務不執行**
   - 檢查 PM2 進程狀態
   - 確認環境變數配置
   - 查看日誌檔案

### 性能優化

1. **資源限制**
   - CPU: 512m - 1 core
   - Memory: 512MB - 1GB
   - Disk: 1GB

2. **擴展配置**
   - 啟用自動擴展
   - 設置資源限制
   - 配置負載均衡

## 更新與維護

### 1. 滾動更新
```bash
# 零停機更新
caprover deploy --default
```

### 2. 回滾策略
```bash
# 回滾到上一版本
caprover rollback --app your-app-name
```

### 3. 監控設置
```bash
# 添加監控
caprover api --method POST --path /user/apps/appDefinitions/update \
  --data '{
    "appName": "your-app-name",
    "monitoring": {
      "enabled": true,
      "webhook": "https://your-monitoring.com/webhook"
    }
  }'
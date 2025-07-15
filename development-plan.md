# Cron Telegram Bot 開發計劃

## 專案概述
建立一個定時向 OpenAI Compatible API 發送提問並將結果回傳到 Telegram 的完整系統，使用 Next.js、MySQL、Telegraf 和 CapRover 部署。

## 技術堆疊
- **後端框架**: Next.js 15.4.1 (App Router)
- **資料庫**: MySQL 8.0 + Prisma ORM
- **Telegram Bot**: Telegraf.js
- **排程任務**: node-cron
- **部署平台**: CapRover
- **容器化**: Docker + PM2

## 系統架構

```mermaid
graph TD
    A[Next.js Frontend] --> B[API Routes]
    B --> C[Cron Job Service]
    C --> D[OpenAI Compatible API]
    D --> E[AI Response]
    C --> F[Telegraf Bot]
    F --> G[Telegram Channel/User]
    C --> H[MySQL Database]
    A --> H
```

## 資料庫結構

### 表格設計
```sql
-- 任務配置表
CREATE TABLE cron_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    schedule VARCHAR(50) NOT NULL,
    telegram_chat_id VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 執行記錄表
CREATE TABLE execution_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cron_job_id INT NOT NULL,
    status ENUM('success', 'failed', 'pending') DEFAULT 'pending',
    prompt_sent TEXT,
    ai_response TEXT,
    error_message TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cron_job_id) REFERENCES cron_jobs(id)
);

-- 系統配置表
CREATE TABLE system_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 專案結構

```
src/
├── app/
│   ├── api/
│   │   ├── cron/
│   │   │   ├── execute/[id]/route.ts
│   │   │   └── status/route.ts
│   │   ├── jobs/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   └── webhook/
│   │       └── telegram/route.ts
│   ├── admin/
│   │   ├── page.tsx
│   │   └── jobs/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   └── globals.css
├── lib/
│   ├── db/
│   │   ├── prisma.ts
│   │   └── schema.prisma
│   ├── services/
│   │   ├── openai.ts
│   │   ├── telegram.ts
│   │   └── cron.ts
│   ├── bot/
│   │   ├── index.ts
│   │   ├── commands.ts
│   │   └── handlers.ts
│   └── types/
│       └── index.ts
├── scripts/
│   ├── cron-runner.ts
│   ├── telegram-setup.ts
│   └── caprover-deploy.sh
├── captain-definition
├── Dockerfile
├── docker-compose.yml
└── ecosystem.config.js
```

## API 端點

### 任務管理
- `GET /api/jobs` - 獲取所有任務
- `POST /api/jobs` - 創建新任務
- `PUT /api/jobs/[id]` - 更新任務
- `DELETE /api/jobs/[id]` - 刪除任務

### 執行控制
- `POST /api/cron/execute/[id]` - 手動執行任務
- `GET /api/cron/status` - 獲取執行狀態

### Telegram Webhook
- `POST /api/webhook/telegram` - 接收 Telegram 訊息

## 開發步驟

### 第一階段：基礎設置
1. 安裝必要套件
   ```bash
   npm install prisma @prisma/client telegraf node-cron axios
   npm install -D @types/node-cron tsx
   ```

2. 初始化 Prisma
   ```bash
   npx prisma init
   npx prisma db push
   ```

3. 設置環境變數
   ```bash
   DATABASE_URL="mysql://username:password@localhost:3306/msg_bot"
   OPENAI_API_KEY="your-api-key"
   OPENAI_API_BASE_URL="https://your-endpoint.com/v1"
   TELEGRAM_BOT_TOKEN="your-bot-token"
   ```

### 第二階段：核心功能
1. 建立資料庫模型和 Prisma schema
2. 實作 OpenAI 服務封裝
3. 建立 Telegraf bot 基礎架構
4. 實作 Cron 任務服務
5. 建立 API Routes

### 第三階段：管理介面
1. 建立任務列表頁面
2. 建立任務編輯頁面
3. 建立執行記錄查看功能
4. 建立系統狀態監控

### 第四階段：測試與優化
1. 單元測試
2. 整合測試
3. 錯誤處理優化
4. 效能優化

## 環境變數配置

```bash
# 資料庫
DATABASE_URL="mysql://username:password@localhost:3306/msg_bot"

# OpenAI
OPENAI_API_KEY="your-api-key"
OPENAI_API_BASE_URL="https://your-openai-compatible-endpoint.com/v1"
OPENAI_MODEL="gpt-3.5-turbo"

# Telegram
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_WEBHOOK_URL="https://your-domain.com/api/webhook/telegram"

# 系統
NODE_ENV
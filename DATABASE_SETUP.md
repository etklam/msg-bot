# Prisma MySQL 設定指南

## 快速設定步驟

### 1. 更新 Prisma Schema
將 `prisma/schema.prisma` 更新為 MySQL 配置：

```prisma
// 更新資料庫提供者
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// 資料表定義
model CronJob {
  id              Int             @id @default(autoincrement())
  name            String          @db.VarChar(255)
  prompt          String          @db.Text
  schedule        String          @db.VarChar(50)
  telegramChatId  String          @map("telegram_chat_id") @db.VarChar(100)
  isActive        Boolean         @default(true) @map("is_active")
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")
  executionLogs   ExecutionLog[]

  @@map("cron_jobs")
}

model ExecutionLog {
  id           Int           @id @default(autoincrement())
  cronJobId    Int           @map("cron_job_id")
  status       LogStatus     @default(PENDING)
  promptSent   String?       @map("prompt_sent") @db.Text
  aiResponse   String?       @map("ai_response") @db.Text
  errorMessage String?       @map("error_message") @db.Text
  executedAt   DateTime      @default(now()) @map("executed_at")
  cronJob      CronJob       @relation(fields: [cronJobId], references: [id])

  @@map("execution_logs")
}

model SystemConfig {
  id          Int       @id @default(autoincrement())
  key         String    @unique @db.VarChar(255)
  value       String?   @db.Text
  description String?   @db.Text
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@map("system_configs")
}

enum LogStatus {
  PENDING
  SUCCESS
  FAILED
}
```

### 2. 環境變數設定
創建 `.env` 檔案：
```bash
DATABASE_URL="mysql://root:password@localhost:3306/msg-bot"
```

### 3. 安裝依賴
```bash
npm install
```

### 4. 初始化資料庫
```bash
# 生成 Prisma Client
npx prisma generate

# 創建資料庫表格
npx prisma db push

# 驗證連接
npx prisma db pull
```

### 5. 測試連接
創建測試腳本 `scripts/test-db.ts`：
```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testConnection() {
  try {
    await prisma.$connect()
    console.log('✅ 資料庫連接成功')
    
    // 創建測試資料
    const testJob = await prisma.cronJob.create({
      data: {
        name: '測試任務',
        prompt: '這是一個測試提問',
        schedule: '0 * * * *',
        telegramChatId: '123456789',
      }
    })
    
    console.log('✅ 測試資料創建成功:', testJob)
    
  } catch (error) {
    console.error('❌ 資料庫錯誤:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
```

### 6. 執行測試
```bash
npx tsx scripts/test-db.ts
```

## 常見問題

### 1. MySQL 連接錯誤
```bash
# 檢查 MySQL 服務
sudo systemctl status mysql

# 檢查端口
netstat -tlnp | grep 3306

# 測試連接
mysql -u root -p -h localhost msg-bot
```

### 2. 權限問題
```bash
# 創建資料庫
mysql -u root -p
CREATE DATABASE `msg-bot`;
GRANT ALL PRIVILEGES ON `msg-bot`.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Prisma 錯誤
```bash
# 重置資料庫（開發環境）
npx prisma migrate reset

# 重新生成
npx prisma generate
```

## 下一步
完成資料庫設定後，繼續實作：
1. 建立 Prisma Client 實例
2. 創建資料庫服務層
3. 實作 API Routes
4. 建立管理介面
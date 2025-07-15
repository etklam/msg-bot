import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testConnection() {
  console.log('🔍 開始測試資料庫連接...')
  
  try {
    // 測試連接
    await prisma.$connect()
    console.log('✅ 資料庫連接成功')
    
    // 檢查資料庫狀態
    const result = await prisma.$queryRaw`SELECT DATABASE() as db, VERSION() as version`
    console.log('📊 資料庫資訊:', result)
    
    // 檢查表格是否存在
    const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `
    console.log('📋 現有表格:', tables)
    
    // 如果沒有表格，創建測試資料
    if (Array.isArray(tables) && tables.length === 0) {
      console.log('📝 創建測試資料...')
      
      const testJob = await prisma.cronJob.create({
        data: {
          name: '測試任務',
          prompt: '這是一個測試提問，請回覆當前時間',
          schedule: '0 * * * *',
          telegramChatId: '123456789',
        }
      })
      
      console.log('✅ 測試資料創建成功:', {
        id: testJob.id,
        name: testJob.name,
        prompt: testJob.prompt,
        schedule: testJob.schedule
      })
      
      // 創建測試執行記錄
      const testLog = await prisma.executionLog.create({
        data: {
          cronJobId: testJob.id,
          status: 'SUCCESS',
          promptSent: testJob.prompt,
          aiResponse: '這是測試回覆：當前時間是 ' + new Date().toLocaleString('zh-TW'),
        }
      })
      
      console.log('✅ 測試記錄創建成功:', {
        id: testLog.id,
        status: testLog.status,
        executedAt: testLog.executedAt
      })
      
    } else {
      console.log('📊 資料庫已有表格，統計資料:')
      
      const jobCount = await prisma.cronJob.count()
      const logCount = await prisma.executionLog.count()
      
      console.log(`- CronJobs: ${jobCount} 個`)
      console.log(`- ExecutionLogs: ${logCount} 個`)
      
      if (jobCount > 0) {
        const latestJob = await prisma.cronJob.findFirst({
          orderBy: { createdAt: 'desc' }
        })
        console.log('🔄 最新任務:', latestJob?.name)
      }
    }
    
  } catch (error) {
    console.error('❌ 資料庫錯誤:', error)
    
    // 詳細錯誤訊息
    if (error instanceof Error) {
      console.error('錯誤類型:', error.constructor.name)
      console.error('錯誤訊息:', error.message)
      
      if ('code' in error) {
        console.error('錯誤代碼:', (error as any).code)
      }
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 資料庫連接已關閉')
  }
}

// 執行測試
testConnection()
  .then(() => {
    console.log('🎉 資料庫測試完成！')
  })
  .catch((error) => {
    console.error('💥 測試失敗:', error)
    process.exit(1)
  })
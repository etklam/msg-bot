import { OpenAIService } from './openai';
import * as dotenv from 'dotenv';

// 載入環境變數
dotenv.config();

/**
 * 測試 OpenAI 服務與 OpenRouter 的整合
 */
async function testOpenRouterIntegration() {
  console.log('🚀 開始測試 OpenRouter 整合...');
  console.log('📋 環境變數檢查:');
  console.log('- API Key:', process.env.OPENAI_API_KEY ? '✅ 已設定' : '❌ 未設定');
  console.log('- Base URL:', process.env.OPENAI_API_BASE_URL || '使用預設值');
  console.log('- Model:', process.env.OPENAI_MODEL || '使用預設值');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ 請確保 .env 檔案包含 OPENAI_API_KEY');
    return;
  }
  
  const openai = new OpenAIService();
  
  try {
    // 測試連線
    console.log('📡 測試連線...');
    const isConnected = await openai.testConnection();
    console.log('✅ 連線測試結果:', isConnected ? '成功' : '失敗');
    
    if (!isConnected) {
      console.log('❌ 連線失敗，請檢查網路或 API 金鑰');
      return;
    }
    
    // 測試實際對話
    console.log('💬 測試對話功能...');
    const response = await openai.chat({
      messages: [
        { role: 'user', content: '請用繁體中文簡單介紹一下你自己' }
      ],
      maxTokens: 150,
      temperature: 0.7,
    });
    
    console.log('✅ 對話回應:');
    console.log(response.choices[0].message.content);
    console.log('📊 使用統計:', {
      promptTokens: response.usage.promptTokens,
      completionTokens: response.usage.completionTokens,
      totalTokens: response.usage.totalTokens,
      model: response.model
    });
    
  } catch (error) {
    console.error('❌ 測試失敗:', error);
  }
}

// 執行測試
if (require.main === module) {
  testOpenRouterIntegration();
}

export { testOpenRouterIntegration };
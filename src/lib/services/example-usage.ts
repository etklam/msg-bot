import { OpenAIService, getOpenAIService } from './openai';
import { OpenAIMessage } from '../types/openai';

/**
 * OpenAI 服務使用範例
 */

// 範例 1: 使用單例實例
async function example1() {
  const openai = getOpenAIService();
  
  const messages: OpenAIMessage[] = [
    { role: 'system', content: '你是一個有幫助的助手' },
    { role: 'user', content: '請介紹一下這個專案' }
  ];

  try {
    const response = await openai.chat({ messages });
    console.log('AI 回應:', response.choices[0].message.content);
  } catch (error) {
    console.error('錯誤:', error);
  }
}

// 範例 2: 使用自定義配置
async function example2() {
  const openai = new OpenAIService({
    apiKey: 'your-api-key',
    baseURL: 'https://your-endpoint.com/v1',
    model: 'gpt-4',
    timeout: 60000,
    maxRetries: 5,
  });

  const messages: OpenAIMessage[] = [
    { role: 'user', content: '解釋什麼是 cron job' }
  ];

  try {
    const response = await openai.chat({
      messages,
      maxTokens: 200,
      temperature: 0.7,
    });
    
    console.log('回應:', response.choices[0].message.content);
    console.log('使用 token:', response.usage.totalTokens);
  } catch (error) {
    console.error('請求失敗:', error);
  }
}

// 範例 3: 測試連線
async function testConnection() {
  const openai = getOpenAIService();
  
  const isConnected = await openai.testConnection();
  console.log('連線狀態:', isConnected ? '正常' : '失敗');
}

// 範例 4: 錯誤處理
async function errorHandlingExample() {
  const openai = getOpenAIService();
  
  try {
    const response = await openai.chat({
      messages: [{ role: 'user', content: '測試訊息' }],
      maxTokens: 50,
    });
    
    return response;
  } catch (error) {
    if (error instanceof Error) {
      console.error('錯誤訊息:', error.message);
      
      // 可以根據錯誤類型做不同處理
      if (error.message.includes('401')) {
        console.error('API 金鑰無效');
      } else if (error.message.includes('429')) {
        console.error('請求頻率限制');
      } else if (error.message.includes('timeout')) {
        console.error('請求超時');
      }
    }
    
    throw error;
  }
}

// 匯出範例函數
export {
  example1,
  example2,
  testConnection,
  errorHandlingExample,
};
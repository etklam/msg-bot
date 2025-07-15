import axios, { AxiosInstance, AxiosError } from 'axios';
import { OpenAIRequest, OpenAIResponse, OpenAIConfig, OpenAIError } from '../types/openai';

export class OpenAIService {
  private client: AxiosInstance;
  private config: OpenAIConfig;

  constructor(config?: Partial<OpenAIConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.OPENAI_API_KEY!,
      baseURL: config?.baseURL || process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
      model: config?.model || process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      timeout: config?.timeout || 30000,
      maxRetries: config?.maxRetries || 3,
      retryDelay: config?.retryDelay || 1000,
    };

    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://msg-bot.local',
        'X-Title': 'Msg Bot',
      },
    });

    // 請求攔截器
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[OpenAI] Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[OpenAI] Request error:', error);
        return Promise.reject(error);
      }
    );

    // 回應攔截器
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[OpenAI] Response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error: AxiosError<OpenAIError>) => {
        console.error('[OpenAI] Response error:', {
          status: error.response?.status,
          message: error.response?.data?.error?.message || error.message,
          code: error.response?.data?.error?.code,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * 發送聊天完成請求
   */
  async chat(request: OpenAIRequest): Promise<OpenAIResponse> {
    const payload = {
      model: request.model || this.config.model,
      messages: request.messages,
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      top_p: request.topP,
      frequency_penalty: request.frequencyPenalty,
      presence_penalty: request.presencePenalty,
      stop: request.stop,
    };

    return this.executeWithRetry(() => 
      this.client.post<OpenAIResponse>('/chat/completions', payload)
        .then(response => response.data)
    );
  }

  /**
   * 執行帶重試的請求
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retries = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries >= this.config.maxRetries!) {
        throw error;
      }

      const axiosError = error as AxiosError;
      
      // 不重試的錯誤類型
      if (axiosError.response?.status === 401 || 
          axiosError.response?.status === 400) {
        throw error;
      }

      console.log(`[OpenAI] Retrying request (${retries + 1}/${this.config.maxRetries})...`);
      
      // 指數退避延遲
      const delay = this.config.retryDelay! * Math.pow(2, retries);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.executeWithRetry(operation, retries + 1);
    }
  }

  /**
   * 測試連線
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.chat({
        messages: [{ role: 'user', content: 'test' }],
        maxTokens: 1,
      });
      return true;
    } catch (error) {
      console.error('[OpenAI] Connection test failed:', error);
      return false;
    }
  }

  /**
   * 獲取當前配置
   */
  getConfig(): OpenAIConfig {
    return { ...this.config };
  }
}

// 單例實例
let openAIServiceInstance: OpenAIService | null = null;

export function getOpenAIService(): OpenAIService {
  if (!openAIServiceInstance) {
    openAIServiceInstance = new OpenAIService();
  }
  return openAIServiceInstance;
}
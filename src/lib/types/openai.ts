export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIRequest {
  messages: OpenAIMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string | string[];
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: OpenAIMessage;
    finishReason: string;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface OpenAIError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

export interface OpenAIConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}
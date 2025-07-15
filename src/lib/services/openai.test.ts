import { OpenAIService } from './openai';
import { OpenAIMessage } from '../types/openai';

// Mock axios
jest.mock('axios');
import axios from 'axios';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OpenAIService', () => {
  let service: OpenAIService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_API_BASE_URL = 'https://api.test.com/v1';
    process.env.OPENAI_MODEL = 'gpt-test';
    
    service = new OpenAIService();
  });

  describe('constructor', () => {
    it('should initialize with environment variables', () => {
      expect(service.getConfig().apiKey).toBe('test-key');
      expect(service.getConfig().baseURL).toBe('https://api.test.com/v1');
      expect(service.getConfig().model).toBe('gpt-test');
    });

    it('should throw error if no API key provided', () => {
      delete process.env.OPENAI_API_KEY;
      expect(() => new OpenAIService()).toThrow('OpenAI API key is required');
    });

    it('should use provided config over environment variables', () => {
      const customService = new OpenAIService({
        apiKey: 'custom-key',
        baseURL: 'https://custom.com/v1',
        model: 'custom-model',
      });
      
      expect(customService.getConfig().apiKey).toBe('custom-key');
      expect(customService.getConfig().baseURL).toBe('https://custom.com/v1');
      expect(customService.getConfig().model).toBe('custom-model');
    });
  });

  describe('chat', () => {
    const mockMessages: OpenAIMessage[] = [
      { role: 'user', content: 'Hello' }
    ];

    const mockResponse = {
      id: 'test-id',
      object: 'chat.completion',
      created: 1234567890,
      model: 'gpt-test',
      choices: [{
        index: 0,
        message: { role: 'assistant', content: 'Hello! How can I help?' },
        finishReason: 'stop'
      }],
      usage: {
        promptTokens: 10,
        completionTokens: 10,
        totalTokens: 20
      }
    };

    it('should send chat completion request', async () => {
      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue({ data: mockResponse }),
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
      } as any);

      const result = await service.chat({ messages: mockMessages });
      
      expect(result).toEqual(mockResponse);
    });

    it('should use default model if not provided', async () => {
      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      mockedAxios.create.mockReturnValue({
        post: mockPost,
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
      } as any);

      await service.chat({ messages: mockMessages });
      
      expect(mockPost).toHaveBeenCalledWith('/chat/completions', expect.objectContaining({
        model: 'gpt-test'
      }));
    });

    it('should use custom model when provided', async () => {
      const mockPost = jest.fn().mockResolvedValue({ data: mockResponse });
      mockedAxios.create.mockReturnValue({
        post: mockPost,
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
      } as any);

      await service.chat({ 
        messages: mockMessages, 
        model: 'custom-model' 
      });
      
      expect(mockPost).toHaveBeenCalledWith('/chat/completions', expect.objectContaining({
        model: 'custom-model'
      }));
    });
  });

  describe('testConnection', () => {
    it('should return true on successful connection', async () => {
      const mockChat = jest.fn().mockResolvedValue({});
      service.chat = mockChat;

      const result = await service.testConnection();
      
      expect(result).toBe(true);
      expect(mockChat).toHaveBeenCalledWith({
        messages: [{ role: 'user', content: 'test' }],
        maxTokens: 1,
      });
    });

    it('should return false on connection failure', async () => {
      const mockChat = jest.fn().mockRejectedValue(new Error('Connection failed'));
      service.chat = mockChat;

      const result = await service.testConnection();
      
      expect(result).toBe(false);
    });
  });

  describe('getOpenAIService', () => {
    it('should return singleton instance', () => {
      const { getOpenAIService } = require('./openai');
      
      const instance1 = getOpenAIService();
      const instance2 = getOpenAIService();
      
      expect(instance1).toBe(instance2);
    });
  });
});
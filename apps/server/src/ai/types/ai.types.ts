import { z } from 'zod';

export type AIWorkflowContext = 'discovery' | 'personalization';

export type AIProviderName = 'gemini' | 'groq';

export interface AIUsageMetrics {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface AIGatewayResponse {
  text: string;
  usage?: AIUsageMetrics;
  metadata: {
    provider: AIProviderName;
    model: string;
    latencyMs: number;
    retries: number;
  };
}

export interface AIRequestOptions {
  prompt: string;
  context: AIWorkflowContext;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  systemInstruction?: string;
}

export interface AIStructuredRequestOptions<T> extends Omit<AIRequestOptions, 'prompt'> {
  prompt: string;
  schema: z.ZodType<T>;
}

export interface AIProvider {
  name: AIProviderName;
  generate(options: AIRequestOptions, apiKey: string, model: string): Promise<AIGatewayResponse>;
}

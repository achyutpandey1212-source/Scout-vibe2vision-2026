import { AIGateway } from '../gateway/ai.gateway';
import { AIWorkflowContext } from '../types/ai.types';

export interface ReasonOptions {
  prompt: string;
  context: AIWorkflowContext;
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
  timeoutMs?: number;
}

/**
 * General text generation & reasoning capability.
 * Prompts the AI model to return plain text responses.
 */
export async function reason(options: ReasonOptions): Promise<string> {
  const gateway = AIGateway.getInstance();
  const response = await gateway.generate({
    prompt: options.prompt,
    context: options.context,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
    systemInstruction: options.systemInstruction,
    timeoutMs: options.timeoutMs,
  });
  return response.text;
}

import { z } from 'zod';
import { generateStructuredResponse } from './structured-output';
import { AIWorkflowContext } from '../types/ai.types';

export interface ExtractOptions<T> {
  text: string;
  schema: z.ZodType<T>;
  context: AIWorkflowContext;
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
  timeoutMs?: number;
}

/**
 * Structured information extraction capability.
 * Prompts the model to parse raw content and extract structured data conforming to the schema.
 */
export async function extract<T>(options: ExtractOptions<T>): Promise<T> {
  const defaultSystemInstruction =
    'You are an expert data extractor. Extract the requested fields from the user provided text accurately. Keep extraction strictly based on the text provided.';

  const prompt = `Extract structured fields from the raw text provided below.

Raw Content:
"""
${options.text}
"""
`;

  return generateStructuredResponse({
    prompt,
    schema: options.schema,
    context: options.context,
    temperature: options.temperature ?? 0.0, // Low temperature for extraction accuracy
    maxTokens: options.maxTokens,
    systemInstruction: options.systemInstruction ?? defaultSystemInstruction,
    timeoutMs: options.timeoutMs,
  });
}

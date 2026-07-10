import { z } from 'zod';
import { AIGateway } from '../gateway/ai.gateway';
import { safeParseJson } from '../utils/parser';
import { AISchemaValidationError } from '../utils/errors';
import { AIWorkflowContext } from '../types/ai.types';

export interface StructuredOutputOptions<T> {
  prompt: string;
  schema: z.ZodType<T>;
  context: AIWorkflowContext;
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
  timeoutMs?: number;
}

/**
 * Zod-validated structured JSON generator capability.
 * Automatically parses text responses, validates schemas, and performs
 * self-healing retries with descriptive feedback if validation fails.
 */
export async function generateStructuredResponse<T>(
  options: StructuredOutputOptions<T>,
): Promise<T> {
  const gateway = AIGateway.getInstance();
  const maxSchemaAttempts = 3; // 1 initial + 2 auto-healing retries
  let attempts = 0;
  let currentPrompt = options.prompt;
  let lastResponseText = '';

  const formatInstructions = `\n\nIMPORTANT: You must respond ONLY with a valid JSON object matching the expected schema. Do not include any chat preamble, postscript, or explanations. Just pure JSON.`;

  if (!currentPrompt.includes('JSON')) {
    currentPrompt += formatInstructions;
  }

  while (attempts < maxSchemaAttempts) {
    attempts++;

    const response = await gateway.generate({
      prompt: currentPrompt,
      context: options.context,
      temperature: options.temperature ?? 0.1, // Structured response favors low temperature
      maxTokens: options.maxTokens,
      systemInstruction: options.systemInstruction,
      timeoutMs: options.timeoutMs,
    });

    lastResponseText = response.text;

    try {
      // 1. Safely extract and parse JSON from the response text
      const parsedData = safeParseJson(lastResponseText);

      // 2. Validate against Zod schema
      const validationResult = options.schema.safeParse(parsedData);

      if (validationResult.success) {
        return validationResult.data;
      }

      // 3. If validation failed, throw validation error to trigger auto-healing
      const errorMsg = JSON.stringify(validationResult.error.format());
      throw new AISchemaValidationError(
        `Zod validation failed: ${validationResult.error.message}`,
        validationResult.error.format(),
        lastResponseText,
      );
    } catch (parseOrValidationError: any) {
      console.warn(
        `[AI Layer] Schema validation failed on attempt ${attempts}/${maxSchemaAttempts}. Error: ${parseOrValidationError.message}`,
      );

      if (attempts >= maxSchemaAttempts) {
        throw parseOrValidationError; // Re-throw if out of attempts
      }

      // Suffix prompt with the error details for the next retry attempt
      const schemaFeedback =
        parseOrValidationError instanceof AISchemaValidationError
          ? `\n\nERROR: The previous response failed Zod validation with the following error schema:\n${JSON.stringify(parseOrValidationError.schemaErrors)}\n\nPlease correct the errors and output the valid JSON conforming strictly to the schema.`
          : `\n\nERROR: The previous response was not valid JSON: ${parseOrValidationError.message}. Please return only the corrected valid JSON object structure.`;

      currentPrompt = options.prompt + formatInstructions + schemaFeedback;
    }
  }

  throw new AISchemaValidationError(
    'Failed to generate valid structured response after maximum attempts',
    null,
    lastResponseText,
  );
}

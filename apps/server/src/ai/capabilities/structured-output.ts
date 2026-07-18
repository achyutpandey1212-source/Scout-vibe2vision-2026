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
  /**
   * Optional deterministic pre-validation sanitizer. Receives the raw parsed
   * JSON (post JSON.parse) and returns the normalized object handed to Zod.
   * Used by the Source Discovery Engine to clean legacy/placeholder values.
   */
  sanitize?: (input: unknown) => unknown;
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

      // 1b. Run the deterministic sanitization/normalization layer (Task 6)
      const sanitizedData = options.sanitize ? options.sanitize(parsedData) : parsedData;

      // 2. Validate against Zod schema
      const validationResult = options.schema.safeParse(sanitizedData);

      if (validationResult.success) {
        return validationResult.data;
      }

      // 3. If validation failed, throw validation error to trigger auto-healing
      throw new AISchemaValidationError(
        `Zod validation failed: ${validationResult.error.message}`,
        validationResult.error.format(),
        lastResponseText,
      );
    } catch (parseOrValidationError: any) {
      console.warn(
        `[AI Layer] Schema validation failed on attempt ${attempts}/${maxSchemaAttempts}. Error: ${parseOrValidationError.message}`,
      );
      console.warn(`[AI Layer] Raw output (first 500 chars): ${lastResponseText.slice(0, 500)}`);

      if (attempts >= maxSchemaAttempts) {
        throw parseOrValidationError; // Re-throw if out of attempts
      }

      // Suffix prompt with a lightweight repair instruction for the next retry
      // (Task 5) — this usually fixes malformed responses on the second attempt.
      const repairInstruction =
        `\n\nYour previous response failed schema validation. ` +
        `Return ONLY valid JSON matching the schema. Do not include explanations. ` +
        `Do not invent placeholder enum values.`;

      const schemaFeedback =
        parseOrValidationError instanceof AISchemaValidationError
          ? `${repairInstruction}\n\nValidation errors:\n${JSON.stringify(parseOrValidationError.schemaErrors)}`
          : `${repairInstruction}\n\nThe previous response was not valid JSON: ${parseOrValidationError.message}.`;

      currentPrompt = options.prompt + formatInstructions + schemaFeedback;
    }
  }

  throw new AISchemaValidationError(
    'Failed to generate valid structured response after maximum attempts',
    null,
    lastResponseText,
  );
}

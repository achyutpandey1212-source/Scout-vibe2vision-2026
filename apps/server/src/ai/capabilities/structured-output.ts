import { z } from 'zod';
import { AIGateway } from '../gateway/ai.gateway';
import { safeParseJson } from '../utils/parser';
import {
  AISchemaValidationError,
  AIIncompleteGenerationError,
  AIParserError,
} from '../utils/errors';
import { DiscoveryProviderManager } from '../gateway/discovery-provider-manager';
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
function isResponseJsonComplete(text: string): boolean {
  const cleaned = text.trim();
  if (cleaned.length < 15) {
    return false;
  }

  const hasBraces = cleaned.includes('{') || cleaned.includes('[');
  if (!hasBraces) {
    return false;
  }

  const hasOpenCurly = cleaned.includes('{');
  const hasCloseCurly = cleaned.includes('}');
  const hasOpenBracket = cleaned.includes('[');
  const hasCloseBracket = cleaned.includes(']');

  if (hasOpenCurly && !hasCloseCurly) return false;
  if (hasOpenBracket && !hasCloseBracket) return false;

  const lastChar = cleaned[cleaned.length - 1];
  if ([':', ',', '{', '['].includes(lastChar)) {
    return false;
  }

  let quoteCount = 0;
  let inEscape = false;
  for (let i = 0; i < cleaned.length; i++) {
    if (inEscape) {
      DiscoveryProviderManager.getInstance().metrics.parserRecoveries++;
      continue;
      console.warn(
        `[Structured Output] Unable to record parser recovery metric: ${(metricErr as Error).message}`,
      );
    }
    if (cleaned[i] === '\\') {
      inEscape = true;
      continue;
    }
    if (cleaned[i] === '"') {
      quoteCount++;
    }
  }
  if (quoteCount % 2 !== 0) {
    return false;
  }

  return true;
}

export async function generateStructuredResponse<T>(
  options: StructuredOutputOptions<T>,
): Promise<T> {
  const gateway = AIGateway.getInstance();
  const maxSchemaAttempts = 3; // 1 initial + 2 auto-healing retries
  let attempts = 0;
  let currentPrompt = options.prompt;
  let lastResponseText = '';
  const attemptLogs: { attempt: number; type: string; reason: string; recovery: string }[] = [];

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
      timeoutMs: options.timeoutMs ?? 15000, // Faster timeout default (Task 4)
      responseMimeType: 'application/json', // Enable native JSON generation (Task 6)
    });

    lastResponseText = response.text;

    try {
      // Early Response Sanity Check (Task 2)
      if (!isResponseJsonComplete(lastResponseText)) {
        throw new AIIncompleteGenerationError(
          'Incomplete JSON response detected early during sanity check.',
          lastResponseText,
        );
      }

      // 1. Safely extract and parse JSON from the response text
      let parsedData: any;
      try {
        parsedData = safeParseJson(lastResponseText);
      } catch (parseErr: any) {
        throw new AIParserError(`JSON parsing failed: ${parseErr.message}`, lastResponseText);
      }

      // 1b. Run the deterministic sanitization/normalization layer
      const sanitizedData = options.sanitize ? options.sanitize(parsedData) : parsedData;

      // 2. Validate against Zod schema
      const validationResult = options.schema.safeParse(sanitizedData);

      if (validationResult.success) {
        if (attempts > 1) {
          try {
            DiscoveryProviderManager.getInstance().metrics.parserRecoveries++;
          } catch (metricErr) {
            console.warn(
              `[Structured Output] Unable to record parser recovery metric: ${(metricErr as Error).message}`,
            );
          }
          console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI Validation Recovered

${attemptLogs
  .map(
    (al: any) => `Attempt ${al.attempt}
  Failure Type:    ${al.type}
  Reason:          ${al.reason}
  Recovery Action: ${al.recovery}`,
  )
  .join('\n\n')}

Final Result:
SUCCESS on attempt ${attempts}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        }
        return validationResult.data;
      }

      // 3. If validation failed, throw validation error to trigger auto-healing
      throw new AISchemaValidationError(
        `Zod validation failed: ${validationResult.error.message}`,
        validationResult.error.format(),
        lastResponseText,
      );
    } catch (parseOrValidationError: any) {
      let failureType = 'Parser';
      let recoveryAction = 'Repair';

      if (parseOrValidationError instanceof AIIncompleteGenerationError) {
        failureType = 'Incomplete JSON';
        recoveryAction = 'Retry';
      } else if (parseOrValidationError instanceof AISchemaValidationError) {
        failureType = 'Schema Alias';
        recoveryAction = 'Retry';
      } else if (parseOrValidationError instanceof AIParserError) {
        failureType = 'Parser';
        recoveryAction = 'Repair';
      } else if (
        parseOrValidationError.name === 'AIRateLimitError' ||
        parseOrValidationError.status === 429
      ) {
        failureType = '429 (Rate Limit)';
        recoveryAction = 'Rotated Key';
      } else if (parseOrValidationError.name === 'AITimeoutError') {
        failureType = 'Timeout';
        recoveryAction = 'Fallback';
      }

      attemptLogs.push({
        attempt: attempts,
        type: failureType,
        reason: parseOrValidationError.message,
        recovery: recoveryAction,
      });

      if (attempts >= maxSchemaAttempts) {
        console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI Validation Failed

${attemptLogs
  .map(
    (al: any) => `Attempt ${al.attempt}
  Failure Type:    ${al.type}
  Reason:          ${al.reason}
  Recovery Action: ${al.recovery}`,
  )
  .join('\n\n')}

Final Result:
FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
          console.warn(
            `[AI Layer] Raw output (first 500 chars): ${lastResponseText.slice(0, 500)}`,
          );
        }
        throw parseOrValidationError; // Re-throw if out of attempts
      }

      // Suffix prompt with a lightweight repair instruction for the next retry
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

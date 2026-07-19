import { AIPersonalizationResponseSchema } from './ai.schemas';
import { IAIPersonalizationResponse } from './ai.types';

export class ResponseValidator {
  /**
   * Cleans Markdown code blocks wrapping from JSON responses if present.
   */
  private static cleanJsonText(text: string): string {
    let clean = text.trim();
    if (clean.startsWith('```')) {
      // Remove starting ```json or ```
      clean = clean.replace(/^```(json)?/i, '').trim();
    }
    if (clean.endsWith('```')) {
      clean = clean.replace(/```$/, '').trim();
    }
    return clean;
  }

  /**
   * Parses and validates raw response text.
   * Returns parsed object or throws validation errors.
   */
  static validate(rawText: string): IAIPersonalizationResponse {
    const cleanedText = this.cleanJsonText(rawText);
    const parsedObj = JSON.parse(cleanedText);

    // Validate schema
    const result = AIPersonalizationResponseSchema.safeParse(parsedObj);
    if (!result.success) {
      throw new Error(`Schema validation failed: ${result.error.message}`);
    }

    return result.data as IAIPersonalizationResponse;
  }
}

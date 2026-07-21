import { AIPersonalizationResponseSchema } from './ai.schemas';
import { IAIPersonalizationResponse } from './ai.types';

export class ResponseValidator {
  /**
   * Cleans Markdown code blocks wrapping from JSON responses if present.
   */
  private static cleanJsonText(text: string): string {
    let clean = text.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(json)?/i, '').trim();
    }
    if (clean.endsWith('```')) {
      clean = clean.replace(/```$/, '').trim();
    }
    return clean;
  }

  /**
   * Truncates a string safely to a maximum character length without breaking JSON.
   */
  private static truncate(str: any, maxLen: number): string {
    if (typeof str !== 'string') return '';
    const trimmed = str.trim();
    if (trimmed.length <= maxLen) return trimmed;
    return trimmed.slice(0, maxLen - 3) + '...';
  }

  /**
   * Sanitizes parsed response object before schema validation to ensure
   * LLM outputs exceeding soft limits are truncated smoothly without failing.
   */
  private static sanitize(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized: any = { ...obj };

    if (sanitized.todayMission) {
      sanitized.todayMission = this.truncate(sanitized.todayMission, 120);
    }
    if (sanitized.aiSummary) {
      sanitized.aiSummary = this.truncate(sanitized.aiSummary, 400);
    }

    if (sanitized.recommendationsBySlot && typeof sanitized.recommendationsBySlot === 'object') {
      const slots: Record<string, any> = {};
      for (const [slotKey, item] of Object.entries(sanitized.recommendationsBySlot)) {
        if (item && typeof item === 'object') {
          const rawItem = item as any;
          slots[slotKey] = {
            personalizedReason: this.truncate(rawItem.personalizedReason || '', 250),
            projectEvidence: rawItem.projectEvidence
              ? this.truncate(rawItem.projectEvidence, 250)
              : undefined,
            whyYou: rawItem.whyYou ? this.truncate(rawItem.whyYou, 200) : undefined,
            whyCompany: rawItem.whyCompany ? this.truncate(rawItem.whyCompany, 200) : undefined,
            whyNow: rawItem.whyNow ? this.truncate(rawItem.whyNow, 150) : undefined,
            missingSkills: Array.isArray(rawItem.missingSkills)
              ? rawItem.missingSkills.slice(0, 3).map((s: any) => this.truncate(s, 120))
              : [],
            firstAction: this.truncate(rawItem.firstAction || '', 120),
            confidenceMessage: this.truncate(rawItem.confidenceMessage || '', 120),
          };
        }
      }
      sanitized.recommendationsBySlot = slots;
    }

    return sanitized;
  }

  /**
   * Parses, sanitizes, and validates raw response text.
   */
  static validate(rawText: string): IAIPersonalizationResponse {
    const cleanedText = this.cleanJsonText(rawText);
    const parsedObj = JSON.parse(cleanedText);

    // Sanitize lengths to prevent schema failure
    const sanitizedObj = this.sanitize(parsedObj);

    // Validate schema
    const result = AIPersonalizationResponseSchema.safeParse(sanitizedObj);
    if (!result.success) {
      throw new Error(`Schema validation failed: ${result.error.message}`);
    }

    return result.data as IAIPersonalizationResponse;
  }
}

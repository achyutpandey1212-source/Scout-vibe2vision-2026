import { SingleCareerReportSchema, AIPersonalizationResponseSchema } from './ai.schemas';
import { ICareerReport, IAIPersonalizationResponse } from './ai.types';

export class ResponseValidator {
  /**
   * Cleans Markdown code blocks wrapping from JSON responses if present.
   */
  public static cleanJsonText(text: string): string {
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
   * Truncates a string safely at a sentence boundary or word boundary without mid-word cutoffs or trailing ellipsis.
   */
  private static truncate(str: any, maxLen: number): string {
    if (typeof str !== 'string') return '';
    const trimmed = str.trim();
    if (trimmed.length <= maxLen) return trimmed;

    const sliceCandidate = trimmed.slice(0, maxLen);
    const lastPeriod = sliceCandidate.lastIndexOf('.');

    // If a sentence end exists after 40% of maxLen, cut cleanly at sentence end
    if (lastPeriod > maxLen * 0.4) {
      return sliceCandidate.slice(0, lastPeriod + 1);
    }

    // Otherwise cut at last space and append a period
    const lastSpace = sliceCandidate.lastIndexOf(' ');
    if (lastSpace > 0) {
      return sliceCandidate.slice(0, lastSpace) + '.';
    }

    return sliceCandidate + '.';
  }

  /**
   * Sanitizes a single Career Report object to ensure complete readable recommendations.
   */
  public static sanitizeSingleReport(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    const validLevels = [
      'Very Competitive',
      'Competitive',
      'Moderate Match',
      'Stretch Opportunity',
      'High Risk',
    ];
    const validVerdicts = [
      'Apply Immediately',
      'Apply After Small Improvements',
      'Stretch Opportunity',
      'Probably Skip',
      'Monitor Later',
    ];

    const level = validLevels.includes(obj.applicationConfidence?.level)
      ? obj.applicationConfidence.level
      : 'Competitive';

    const verdict = validVerdicts.includes(obj.scoutVerdict?.verdict)
      ? obj.scoutVerdict.verdict
      : 'Apply Immediately';

    return {
      executiveSummary: this.truncate(
        obj.executiveSummary || obj.personalizedReason || 'Personalized recommendation match.',
        500,
      ),
      whyScoutPickedThis: this.truncate(
        obj.whyScoutPickedThis || 'Selected based on your skills and background.',
        950,
      ),
      strongestStrengths: Array.isArray(obj.strongestStrengths)
        ? obj.strongestStrengths.slice(0, 5).map((s: any) => this.truncate(s, 500))
        : ['Strong background alignment'],
      missingSkills: Array.isArray(obj.missingSkills)
        ? obj.missingSkills.slice(0, 5).map((s: any) => this.truncate(s, 600))
        : [],
      resumeImprovements: Array.isArray(obj.resumeImprovements)
        ? obj.resumeImprovements.slice(0, 5).map((s: any) => this.truncate(s, 500))
        : ['Highlight key technical projects at the top of your resume.'],
      interviewPrep: Array.isArray(obj.interviewPrep)
        ? obj.interviewPrep.slice(0, 5).map((s: any) => this.truncate(s, 500))
        : ['Be ready to discuss core project architecture decisions.'],
      applicationConfidence: {
        level,
        explanation: this.truncate(
          obj.applicationConfidence?.explanation || 'Match score indicates strong alignment.',
          380,
        ),
      },
      nextAction: this.truncate(
        obj.nextAction || obj.firstAction || 'Review application details and submit.',
        350,
      ),
      scoutVerdict: {
        verdict,
        explanation: this.truncate(
          obj.scoutVerdict?.explanation || 'Aligned with your current engineering goals.',
          380,
        ),
      },
      personalizedReason: this.truncate(
        obj.executiveSummary || obj.personalizedReason || 'Personalized recommendation match.',
        250,
      ),
      whyNow: this.truncate(obj.nextAction || obj.firstAction || 'Applications active.', 150),
      firstAction: this.truncate(
        obj.nextAction || obj.firstAction || 'Review application details.',
        150,
      ),
      confidenceMessage: this.truncate(
        obj.applicationConfidence?.explanation || 'Solid candidate match.',
        150,
      ),
    };
  }

  /**
   * Validates a single Career Report response text.
   */
  static validateSingleReport(rawText: string): ICareerReport {
    const cleanedText = this.cleanJsonText(rawText);
    const parsedObj = JSON.parse(cleanedText);
    const sanitized = this.sanitizeSingleReport(parsedObj);

    const result = SingleCareerReportSchema.safeParse(sanitized);
    if (!result.success) {
      throw new Error(`Single report validation failed: ${result.error.message}`);
    }

    return result.data as ICareerReport;
  }

  /**
   * Legacy multi-item validator.
   */
  static validate(rawText: string): IAIPersonalizationResponse {
    const cleanedText = this.cleanJsonText(rawText);
    const parsedObj = JSON.parse(cleanedText);

    if (parsedObj.todayMission) {
      parsedObj.todayMission = this.truncate(parsedObj.todayMission, 120);
    }
    if (parsedObj.aiSummary) {
      parsedObj.aiSummary = this.truncate(parsedObj.aiSummary, 400);
    }

    if (parsedObj.recommendationsBySlot) {
      const sanitizedSlots: Record<string, any> = {};
      for (const [k, v] of Object.entries(parsedObj.recommendationsBySlot)) {
        sanitizedSlots[k] = this.sanitizeSingleReport(v);
      }
      parsedObj.recommendationsBySlot = sanitizedSlots;
    }

    const result = AIPersonalizationResponseSchema.safeParse(parsedObj);
    if (!result.success) {
      throw new Error(`Schema validation failed: ${result.error.message}`);
    }

    return result.data as IAIPersonalizationResponse;
  }
}

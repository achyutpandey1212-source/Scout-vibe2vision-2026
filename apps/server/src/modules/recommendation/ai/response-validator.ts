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

    // Reserve 1 character for the potential appended period
    const limit = maxLen - 1;
    const sliceCandidate = trimmed.slice(0, limit);
    const lastPeriod = sliceCandidate.lastIndexOf('.');

    // If a sentence end exists after 40% of limit, cut cleanly at sentence end
    if (lastPeriod > limit * 0.4) {
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
    if (!obj || typeof obj !== 'object') obj = {};

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
      : typeof obj.applicationConfidence === 'string'
        ? obj.applicationConfidence
        : 'Competitive';

    const verdict = validVerdicts.includes(obj.scoutVerdict?.verdict)
      ? obj.scoutVerdict.verdict
      : typeof obj.scoutVerdict === 'string'
        ? obj.scoutVerdict
        : 'Apply Immediately';

    // Helper to safely extract non-empty string from multiple candidate keys
    const getStr = (...keys: string[]): string | undefined => {
      for (const k of keys) {
        if (typeof obj[k] === 'string' && obj[k].trim().length > 0) {
          return obj[k].trim();
        }
      }
      return undefined;
    };

    // Helper to safely extract string array from multiple candidate keys
    const getArr = (...keys: string[]): string[] | undefined => {
      for (const k of keys) {
        if (Array.isArray(obj[k]) && obj[k].length > 0) {
          const mapped = obj[k]
            .map((item: any) => (typeof item === 'string' ? item : JSON.stringify(item)))
            .filter((s: string) => s.trim().length > 0);
          if (mapped.length > 0) return mapped;
        }
      }
      return undefined;
    };

    const execSummary = getStr('executiveSummary', 'personalizedReason', 'whyScoutPickedThis');
    const whyPicked = getStr('whyScoutPickedThis', 'executiveSummary', 'personalizedReason');
    const strengths = getArr('strongestStrengths', 'strengths');
    const missing = getArr('missingSkills', 'challenges');
    const resumeImps = getArr('resumeImprovements', 'preparationChecklist');
    const interview = getArr('interviewPrep', 'preparationChecklist');
    const appStrategy = getStr('applicationStrategy', 'whyScoutPickedThis', 'executiveSummary');
    const prepChecklist = getArr('preparationChecklist', 'interviewPrep', 'resumeImprovements');
    const nextAct = getStr('nextAction', 'firstAction');

    return {
      executiveSummary: this.truncate(
        execSummary || 'Strong candidate alignment based on profile and experience.',
        500,
      ),
      whyScoutPickedThis: this.truncate(
        whyPicked || 'Selected based on relevant technical background and target goals.',
        950,
      ),
      strongestStrengths: strengths
        ? strengths.slice(0, 5).map((s: string) => this.truncate(s, 500))
        : ['Demonstrated relevant technical background'],
      missingSkills: missing ? missing.slice(0, 5).map((s: string) => this.truncate(s, 600)) : [],
      resumeImprovements: resumeImps
        ? resumeImps.slice(0, 5).map((s: string) => this.truncate(s, 500))
        : ['Highlight relevant project experience and technical skills prominently.'],
      interviewPrep: interview
        ? interview.slice(0, 5).map((s: string) => this.truncate(s, 500))
        : ['Be ready to discuss core project architecture and technical decisions.'],
      applicationConfidence: {
        level,
        explanation: this.truncate(
          obj.applicationConfidence?.explanation ||
            (typeof obj.applicationConfidence === 'string'
              ? obj.applicationConfidence
              : 'Match score indicates strong background alignment.'),
          380,
        ),
      },
      nextAction: this.truncate(
        nextAct || 'Review application details and submit your application.',
        350,
      ),
      scoutVerdict: {
        verdict,
        explanation: this.truncate(
          obj.scoutVerdict?.explanation ||
            (typeof obj.scoutVerdict === 'string'
              ? obj.scoutVerdict
              : 'Aligned with your current engineering goals.'),
          380,
        ),
      },
      personalizedReason: this.truncate(execSummary || 'Personalized recommendation match.', 250),
      whyNow: this.truncate(nextAct || 'Applications active.', 150),
      firstAction: this.truncate(nextAct || 'Review application details.', 150),
      confidenceMessage: this.truncate(
        obj.applicationConfidence?.explanation || 'Solid candidate match.',
        150,
      ),
      strengths: strengths
        ? strengths.slice(0, 5).map((s: string) => this.truncate(s, 500))
        : ['Strong background alignment'],
      challenges: missing
        ? missing.slice(0, 5).map((s: string) => this.truncate(s, 500))
        : ['No major challenge identified'],
      applicationStrategy: this.truncate(
        appStrategy || 'Highlight your relevant technical projects during application.',
        500,
      ),
      preparationChecklist: prepChecklist
        ? prepChecklist.slice(0, 6).map((s: string) => this.truncate(s, 500))
        : ['Review core project architecture and technical questions.'],
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
   * Validates multi-slot career recommendation responses.
   */
  static validate(rawText: string): IAIPersonalizationResponse {
    const cleanedText = this.cleanJsonText(rawText);
    const parsedObj = JSON.parse(cleanedText);

    if (parsedObj.todayMission) {
      parsedObj.todayMission = this.truncate(parsedObj.todayMission, 120);
    }
    if (parsedObj.aiSummary) {
      parsedObj.aiSummary = this.truncate(parsedObj.aiSummary, 600);
    }

    // Extract slots map if provided under recommendationsBySlot OR at root level
    let rawSlotsMap: Record<string, any> = {};
    if (parsedObj.recommendationsBySlot && typeof parsedObj.recommendationsBySlot === 'object') {
      rawSlotsMap = parsedObj.recommendationsBySlot;
    } else {
      rawSlotsMap = parsedObj;
    }

    // Map legacy slot keys to canonical slot names
    const slotMapping: Record<string, string> = {
      perfectMatch: 'perfectMatch',
      hiddenGem: 'hiddenGem',
      quickWin: 'quickWin',
      fastApply: 'quickWin',
      confidenceBuilder: 'confidenceBuilder',
      resumeBuilder: 'confidenceBuilder',
      stretchGoal: 'stretchGoal',
    };

    const targetSlotKeys = [
      'perfectMatch',
      'hiddenGem',
      'quickWin',
      'confidenceBuilder',
      'stretchGoal',
    ];
    const sanitizedSlots: Record<string, any> = {};

    for (const [sourceKey, targetKey] of Object.entries(slotMapping)) {
      if (rawSlotsMap[sourceKey] && typeof rawSlotsMap[sourceKey] === 'object') {
        sanitizedSlots[targetKey] = this.sanitizeSingleReport(rawSlotsMap[sourceKey]);
      }
    }

    // Ensure all 5 target slots exist
    for (const key of targetSlotKeys) {
      if (!sanitizedSlots[key]) {
        sanitizedSlots[key] = this.sanitizeSingleReport(rawSlotsMap[key] || {});
      }
    }

    parsedObj.recommendationsBySlot = sanitizedSlots;

    const result = AIPersonalizationResponseSchema.safeParse(parsedObj);
    if (!result.success) {
      throw new Error(`Schema validation failed: ${result.error.message}`);
    }

    return result.data as IAIPersonalizationResponse;
  }
}

import { OpportunitySchema } from '../schemas/opportunity.schema';
import { ZodError } from 'zod';

/**
 * Validates normalized opportunity details against the Zod schema rules.
 * Returns the full ZodError on failure so callers can inspect individual field issues.
 */
export function validateOpportunity(opp: any): { success: boolean; error?: ZodError } {
  try {
    const parseResult = OpportunitySchema.safeParse(opp);
    if (!parseResult.success) {
      return { success: false, error: parseResult.error };
    }
    return { success: true };
  } catch (err: any) {
    // Unexpected error — wrap in a minimal shape so callers degrade gracefully
    return { success: false, error: err };
  }
}

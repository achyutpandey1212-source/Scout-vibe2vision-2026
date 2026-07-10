import { OpportunitySchema } from '../schemas/opportunity.schema';

/**
 * Validates normalized opportunity details against the Zod schema rules.
 */
export function validateOpportunity(opp: any): { success: boolean; error?: string } {
  try {
    const parseResult = OpportunitySchema.safeParse(opp);
    if (!parseResult.success) {
      const message = parseResult.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      return { success: false, error: message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

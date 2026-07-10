import { env } from '../../../config/env';
import { generateStructuredResponse } from '../../../ai/capabilities/structured-output';
import { OpportunitySchema } from '../schemas/opportunity.schema';
import {
  EXTRACTION_SYSTEM_INSTRUCTION,
  buildUserPrompt,
  EXTRACTION_VERSION,
} from '../prompts/extract-opportunity.prompt';
import { normalizeOpportunity } from '../utils/normalizers';
import { validateOpportunity } from '../utils/validators';
import { Opportunity } from '../types/opportunity.types';

/**
 * Pure extraction pipeline: receives a RawPage document and runs structured AI extraction,
 * Zod validation, normalization, and returns a fully formed Opportunity object.
 * Does NOT persist directly to the database.
 */
export async function extractOpportunityFromPage(
  rawPage: any,
  originalScore: number,
  originalQuery: string,
): Promise<Opportunity> {
  const startTime = Date.now();
  const prompt = buildUserPrompt(
    rawPage.url,
    rawPage.title,
    rawPage.markdown,
    originalScore,
    originalQuery,
  );

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Processing RawPage: "${rawPage.title}"`);
  console.log(`Source URL:         ${rawPage.url}`);

  try {
    // 1. AI Extraction + Zod validation with built-in auto-healing retries
    const rawExtracted = await generateStructuredResponse({
      prompt,
      schema: OpportunitySchema,
      context: 'discovery',
      systemInstruction: EXTRACTION_SYSTEM_INSTRUCTION,
      temperature: 0.1, // High precision, low temperature
    });

    const latencyMs = Date.now() - startTime;

    // 2. TypeScript Post-Processing (Normalization)
    const normalized = normalizeOpportunity(rawExtracted);

    // 3. Enrich with metadata fields
    const enriched: Opportunity = {
      ...normalized,
      rawPageId: rawPage._id ? rawPage._id.toString() : 'mock_raw_page_id',
      hash: rawPage.hash || 'no_hash',
      aiMetadata: {
        provider: env.DISCOVERY_PROVIDER || 'gemini',
        model: env.DISCOVERY_MODEL || 'gemini-2.5-pro',
        latencyMs,
        extractionVersion: EXTRACTION_VERSION,
      },
    };

    // 4. Final TypeScript Validation check
    const validationResult = validateOpportunity(enriched);
    if (!validationResult.success) {
      throw new Error(`Opportunity failed final validation check: ${validationResult.error}`);
    }

    console.log(`AI Provider:        ${enriched.aiMetadata.provider.toUpperCase()}`);
    console.log(`Latency:            ${(latencyMs / 1000).toFixed(1)}s`);
    console.log(`Confidence:         ${enriched.confidence.toFixed(2)}`);
    console.log(`Status:             SUCCESS`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━`);

    return enriched;
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    console.error(`AI Provider:        Failed`);
    console.error(`Latency:            ${(latencyMs / 1000).toFixed(1)}s`);
    console.error(`Status:             FAILED`);
    console.error(`Reason:             ${error.message}`);
    console.error(`━━━━━━━━━━━━━━━━━━━━━━`);
    throw error;
  }
}

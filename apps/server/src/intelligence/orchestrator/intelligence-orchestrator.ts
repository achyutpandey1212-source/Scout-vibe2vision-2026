import { IntelligencePipelineOptions, IntelligencePipelineResult } from './pipeline.types';
import { IntelligencePipelineOptionsSchema } from './pipeline.schema';
import { IntelligenceRepository } from './intelligence.repository';
import { enrichOpportunity } from '../enrichment';
import { scoreOpportunity } from '../scoring';
import { validateOpportunity } from './validation';
import { Opportunity } from '../../discovery/extraction/types/opportunity.types';
import { ENRICHMENT_VERSION } from '../enrichment/engine/enrichment-engine';

export const CURRENT_INTELLIGENCE_VERSION = ENRICHMENT_VERSION;

/**
 * Executes the Opportunity Intelligence Orchestration pipeline.
 * Idempotently enriches, scores, validates, and persists pending opportunities.
 */
export async function runOpportunityIntelligence(
  options?: IntelligencePipelineOptions,
): Promise<IntelligencePipelineResult> {
  const parsedOptions = IntelligencePipelineOptionsSchema.parse(options || {});
  const { force, batchSize } = parsedOptions;

  const startTime = Date.now();
  const errors: string[] = [];

  // Telemetry variables
  let loadedCount = 0;
  let skippedCount = 0;
  let enrichedCount = 0;
  let scoredCount = 0;
  let validatedCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;

  const trustScores: number[] = [];
  const popularityScores: number[] = [];
  const hiddenScores: number[] = [];
  const qualityScores: number[] = [];

  let highestHidden: { title: string; score: number } | null = null;
  let highestTrust: { title: string; score: number } | null = null;
  let lowestQuality: { title: string; score: number } | null = null;

  try {
    // 1. Load pending opportunities
    const pendingDocs = await IntelligenceRepository.loadPending(
      batchSize,
      CURRENT_INTELLIGENCE_VERSION,
      force,
    );

    loadedCount = pendingDocs.length;
    if (loadedCount === 0) {
      return {
        success: true,
        errors: [],
        metrics: {
          loaded: 0,
          skipped: 0,
          enriched: 0,
          scored: 0,
          validated: 0,
          updated: 0,
          unchanged: 0,
          avgTrust: 0,
          avgPopularity: 0,
          avgHidden: 0,
          avgQuality: 0,
          highestHidden: null,
          highestTrust: null,
          lowestQuality: null,
          avgRuntimePerOpportunityMs: 0,
          totalRuntimeMs: Date.now() - startTime,
        },
      };
    }

    const bulkUpdates: { id: string; opportunity: Opportunity }[] = [];

    // 2. Coordinate Pipeline Stages
    for (const doc of pendingDocs) {
      const opportunity = doc.toObject();
      const prevIntel = opportunity.intelligence;

      // Skip processed records if force is false
      if (!force && prevIntel?.version === CURRENT_INTELLIGENCE_VERSION) {
        skippedCount++;
        continue;
      }

      // Stage A: Enrichment Engine
      const enrichedOpp = enrichOpportunity(opportunity);
      enrichedCount++;

      // Stage B: Scoring Engine
      const scoredOpp = scoreOpportunity(enrichedOpp);
      scoredCount++;

      // Set timestamp and assert presence of intelligence & scores
      if (!scoredOpp.intelligence || !scoredOpp.intelligence.scores) {
        errors.push(`[Error] Scored opportunity ID: ${doc._id} lacks intelligence or scores`);
        continue;
      }
      scoredOpp.intelligence.lastProcessedAt = new Date();

      // Stage C: Validation Engine
      const validation = validateOpportunity(scoredOpp, CURRENT_INTELLIGENCE_VERSION);
      if (!validation.success) {
        errors.push(
          `[Validation Error] Opp ID: ${doc._id} | Errors: ${validation.errors.join(', ')}`,
        );
        continue;
      }
      validatedCount++;

      // Stage D: Check if changes occurred to decide persistence (Idempotency)
      let hasChanged = true;
      if (prevIntel) {
        const scoresMatch =
          JSON.stringify(prevIntel.scores) === JSON.stringify(scoredOpp.intelligence.scores);
        const metadataMatch =
          JSON.stringify(prevIntel.metadata) === JSON.stringify(scoredOpp.intelligence.metadata);
        const orgMatch =
          prevIntel.normalizedOrganization === scoredOpp.intelligence.normalizedOrganization;
        const deadlineMatch =
          prevIntel.normalizedDeadline === scoredOpp.intelligence.normalizedDeadline;
        const categoryMatch = doc.category === scoredOpp.category;
        const sourceTypeMatch = doc.sourceType === scoredOpp.sourceType;

        if (
          scoresMatch &&
          metadataMatch &&
          orgMatch &&
          deadlineMatch &&
          categoryMatch &&
          sourceTypeMatch
        ) {
          hasChanged = false;
        }
      }

      if (hasChanged) {
        bulkUpdates.push({
          id: doc._id.toString(),
          opportunity: scoredOpp,
        });
        updatedCount++;
      } else {
        unchangedCount++;
      }

      // Gather Metrics
      const scores = scoredOpp.intelligence.scores;
      trustScores.push(scores.trust);
      popularityScores.push(scores.popularity);
      hiddenScores.push(scores.hidden);
      qualityScores.push(scores.quality);

      if (!highestHidden || scores.hidden > highestHidden.score) {
        highestHidden = { title: scoredOpp.title, score: scores.hidden };
      }
      if (!highestTrust || scores.trust > highestTrust.score) {
        highestTrust = { title: scoredOpp.title, score: scores.trust };
      }
      if (!lowestQuality || scores.quality < lowestQuality.score) {
        lowestQuality = { title: scoredOpp.title, score: scores.quality };
      }
    }

    // Stage E: Persistence
    if (bulkUpdates.length > 0) {
      await IntelligenceRepository.bulkUpdate(bulkUpdates);
    }

    const totalRuntimeMs = Date.now() - startTime;
    const processedOpportunities = enrichedCount;
    const avgRuntimePerOpportunityMs =
      processedOpportunities > 0
        ? parseFloat((totalRuntimeMs / processedOpportunities).toFixed(2))
        : 0;

    const avg = (arr: number[]) =>
      arr.length > 0 ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)) : 0;

    const metricsResult = {
      loaded: loadedCount,
      skipped: skippedCount,
      enriched: enrichedCount,
      scored: scoredCount,
      validated: validatedCount,
      updated: updatedCount,
      unchanged: unchangedCount,
      avgTrust: avg(trustScores),
      avgPopularity: avg(popularityScores),
      avgHidden: avg(hiddenScores),
      avgQuality: avg(qualityScores),
      highestHidden,
      highestTrust,
      lowestQuality,
      avgRuntimePerOpportunityMs,
      totalRuntimeMs,
    };

    // Print rich Telemetry summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Opportunity Intelligence Run');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Loaded:                ${metricsResult.loaded}`);
    console.log(`Skipped (processed):    ${metricsResult.skipped}`);
    console.log(`Enriched:              ${metricsResult.enriched}`);
    console.log(`Scored:                ${metricsResult.scored}`);
    console.log(`Validated:             ${metricsResult.validated}`);
    console.log(`Updated:                ${metricsResult.updated}`);
    console.log(`Unchanged:               ${metricsResult.unchanged}`);
    console.log('------------------------------');
    console.log(`Average Trust:          ${metricsResult.avgTrust}`);
    console.log(`Average Hidden:         ${metricsResult.avgHidden}`);
    console.log(`Average Quality:        ${metricsResult.avgQuality}`);
    console.log('------------------------------');
    if (metricsResult.highestHidden) {
      console.log(
        `Highest Hidden:\n• ${metricsResult.highestHidden.title} (${metricsResult.highestHidden.score})`,
      );
    }
    if (metricsResult.highestTrust) {
      console.log(
        `Highest Trust:\n• ${metricsResult.highestTrust.title} (${metricsResult.highestTrust.score})`,
      );
    }
    if (metricsResult.lowestQuality) {
      console.log(
        `Lowest Quality:\n• ${metricsResult.lowestQuality.title} (${metricsResult.lowestQuality.score})`,
      );
    }
    console.log('------------------------------');
    console.log(`Runtime:\n${metricsResult.avgRuntimePerOpportunityMs} ms/opportunity`);
    console.log(`Total: ${metricsResult.totalRuntimeMs} ms`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return {
      success: errors.length === 0,
      metrics: metricsResult,
      errors,
    };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      errors: [errMsg, ...errors],
      metrics: {
        loaded: loadedCount,
        skipped: skippedCount,
        enriched: enrichedCount,
        scored: scoredCount,
        validated: validatedCount,
        updated: updatedCount,
        unchanged: unchangedCount,
        avgTrust: 0,
        avgPopularity: 0,
        avgHidden: 0,
        avgQuality: 0,
        highestHidden: null,
        highestTrust: null,
        lowestQuality: null,
        avgRuntimePerOpportunityMs: 0,
        totalRuntimeMs: Date.now() - startTime,
      },
    };
  }
}

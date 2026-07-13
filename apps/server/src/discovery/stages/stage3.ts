import { IPipelineStage } from './pipeline-stage.interface';
import { CrawledPage } from './stage2';
import { OpportunityDetector } from '../utils/opportunity-detector';
import { DiscoveryProviderManager } from '../../ai/gateway/discovery-provider-manager';
import { generateStructuredResponse } from '../../ai/capabilities/structured-output';
import { DashboardStateInstance } from '../utils/dashboard-state';
import { OpportunitySchema } from '../extraction/schemas/opportunity.schema';
import {
  EXTRACTION_SYSTEM_INSTRUCTION,
  buildUserPrompt,
  EXTRACTION_VERSION,
} from '../extraction/prompts/extract-opportunity.prompt';
import { normalizeOpportunity } from '../extraction/utils/normalizers';
import { validateOpportunity } from '../extraction/utils/validators';
import { Opportunity, GoldReason } from '../extraction/types/opportunity.types';
import { safeParseJson } from '../../ai/utils/parser';
import mongoose from 'mongoose';

export interface Stage3Analytics {
  pagesReceived: number;
  pagesPassedDetector: number;
  pagesSkippedDetector: number;
  successfulExtractions: number;
  failedExtractions: number;
  totalTokensConsumed: number;
  providerRotations: number;
}

export class Stage3Extraction implements IPipelineStage<CrawledPage[], Opportunity[]> {
  private providerManager: DiscoveryProviderManager;

  constructor() {
    this.providerManager = DiscoveryProviderManager.getInstance();
  }

  /**
   * Post-extraction intelligence classifier (runs entirely deterministically on extracted output)
   */
  private classifyOpportunityIntelligence(
    opp: Opportunity,
    pageUrl: string,
  ): {
    trustScore: number;
    goldReasons: GoldReason[];
  } {
    const goldReasons: GoldReason[] = [];
    let trustScore = 40; // Base trust score

    const host = new URL(pageUrl).hostname.toLowerCase();

    // 1. Trust Scoring Heuristic Checks
    if (host.endsWith('.gov.in') || host.endsWith('.nic.in')) {
      trustScore += 30;
    } else if (host.endsWith('.edu') || host.endsWith('.ac.in')) {
      trustScore += 25;
    }

    if (opp.sourceType === 'GOVERNMENT') {
      trustScore += 20;
    } else if (opp.sourceType === 'UNIVERSITY') {
      trustScore += 15;
    }

    if (opp.applicationUrl && opp.applicationUrl.startsWith('http')) {
      trustScore += 10;
    }
    if (opp.deadline && opp.deadline.trim() !== '') {
      trustScore += 10;
    }
    if (opp.description && opp.description.length > 200) {
      trustScore += 5;
    }
    if (opp.confidence && opp.confidence >= 0.85) {
      trustScore += 10;
    }

    trustScore = Math.min(100, Math.max(0, trustScore));

    // 2. Gold Opportunity Reason tagging (Gold status derived at runtime from this field)
    if ((opp.sourceType === 'GOVERNMENT' || host.endsWith('.gov.in')) && opp.confidence >= 0.85) {
      goldReasons.push('government');
    }
    if (opp.fundingType === 'FULLY_FUNDED') {
      goldReasons.push('fully-funded');
    }
    if (opp.stipend !== undefined && opp.stipend !== null && opp.stipend > 0) {
      goldReasons.push('stipend');
    }
    if (opp.remote) {
      goldReasons.push('mentorship');
    }
    if (opp.travelFunded) {
      goldReasons.push('travel-sponsored');
    }
    if (opp.country && opp.country !== 'India' && opp.country.trim() !== '') {
      goldReasons.push('international');
    }
    if (opp.estimatedCompetition === 'LOW') {
      goldReasons.push('low-competition');
    }

    return {
      trustScore,
      goldReasons,
    };
  }

  /**
   * Executes Stage 3: AI Opportunity Extraction & Structural Validation
   */
  async execute(crawledPages: CrawledPage[], options?: any): Promise<Opportunity[]> {
    console.log(
      `[Stage 3] Initializing opportunity extraction for ${crawledPages.length} pages...`,
    );
    const extractions: Opportunity[] = [];

    // Analytics tracking
    let pagesPassedDetector = 0;
    let pagesSkippedDetector = 0;
    let successfulExtractions = 0;
    let failedExtractions = 0;

    for (const page of crawledPages) {
      if (page.crawlStatus !== 'SUCCESS') {
        console.log(
          `[Stage 3] Skipping page ${page.url} due to Stage 2 crawl status: ${page.crawlStatus}`,
        );
        continue;
      }

      // 1. Inexpensive Deterministic Opportunity Detection pre-filter
      const detection = OpportunityDetector.detect(page.url, page.title, page.markdown);

      if (!detection.shouldExtract) {
        pagesSkippedDetector++;
        console.log(
          `\n[Stage 3] [DETECTOR SKIP] Page does not contain clear opportunity features.`,
        );
        console.log(`URL:         ${page.url}`);
        console.log(`Confidence:  ${detection.confidence}/100`);
        console.log(`Penalties:   ${detection.penalties.join('; ')}`);
        console.log(`Reasons:     ${detection.reasons.join('; ')}`);
        continue;
      }

      DashboardStateInstance.updateState({
        currentStage: 'STAGE_3_EXTRACTION',
        currentUrl: page.url,
      });

      pagesPassedDetector++;
      console.log(`\n[Stage 3] [DETECTOR PASS] Extracting opportunity...`);
      console.log(`URL:         ${page.url}`);
      console.log(`Confidence:  ${detection.confidence}/100`);

      const startTime = Date.now();
      const prompt = buildUserPrompt(
        page.url,
        page.title,
        page.markdown,
        14, // legacy relevance score fallback
        'orchestrated query',
      );

      let rawExtracted: any = null;
      let parserStatus = 'PENDING';
      let latencyMs = 0;

      try {
        // 2. Route AI call through our rotation-aware Provider Manager
        rawExtracted = await this.providerManager.generate({
          prompt,
          context: 'discovery',
          temperature: 0.1,
          systemInstruction: EXTRACTION_SYSTEM_INSTRUCTION,
        });

        latencyMs = Date.now() - startTime;

        if (!rawExtracted.text || rawExtracted.text.trim() === '') {
          parserStatus = 'MODEL_EMPTY_RESPONSE';
          throw new Error('MODEL_EMPTY_RESPONSE');
        }

        let parsedData: any;
        try {
          parsedData = safeParseJson(rawExtracted.text);
          parserStatus = 'SUCCESS';
        } catch (parseErr: any) {
          console.error(`[Stage 3] [JSON_PARSE_FAILED] Failed to parse JSON from AI response.`);
          console.error(`Raw Response:\n${rawExtracted.text}`);

          // Try standard extraction fallback as a last resort
          let fallbackCleaned = rawExtracted.text.trim();
          const firstBrace = fallbackCleaned.indexOf('{');
          const lastBrace = fallbackCleaned.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            fallbackCleaned = fallbackCleaned.substring(firstBrace, lastBrace + 1);
            try {
              parsedData = JSON.parse(fallbackCleaned);
              parserStatus = 'SUCCESS';
              console.log(`[Stage 3] Recovered JSON parsing via fallback substring extraction.`);
            } catch (innerErr) {
              console.error(`Cleaned Response tried:\n${fallbackCleaned}`);
              console.error(`Parser error:`, parseErr);
              parserStatus = 'JSON_PARSE_FAILED';
              throw new Error('JSON_PARSE_FAILED');
            }
          } else {
            console.error(`Parser error:`, parseErr);
            parserStatus = 'JSON_PARSE_FAILED';
            throw new Error('JSON_PARSE_FAILED');
          }
        }

        // 3. Post-Process Normalization & Enrichment
        const normalized = normalizeOpportunity(parsedData);

        // Generate mock raw page ID for pure decoupling
        const rawPageId = new mongoose.Types.ObjectId().toString();

        // 3.1 Classify trust and gold reasons deterministically (isGoldOpportunity removed)
        const intel = this.classifyOpportunityIntelligence(normalized, page.url);

        // Keep fundingStatus backward compatibility alignment
        let fundingStatus = normalized.fundingStatus;
        if (!fundingStatus) {
          if (
            normalized.fundingType === 'PAID' ||
            normalized.fundingType === 'FULLY_FUNDED' ||
            (normalized.stipend && normalized.stipend > 0)
          ) {
            fundingStatus = 'PAID';
          } else if (normalized.fundingType === 'UNPAID') {
            fundingStatus = 'UNPAID';
          }
        }

        const enriched: Opportunity = {
          ...normalized,
          fundingStatus,
          goldReasons: intel.goldReasons,
          trustScore: intel.trustScore,
          sourceURL: normalized.sourceURL || page.url,
          sourceDomain: normalized.sourceDomain || new URL(page.url).hostname,
          applicationUrl: normalized.applicationUrl || page.url,
          rawPageId,
          hash: 'dec_hash',
          aiMetadata: {
            provider: rawExtracted.metadata.provider,
            model: rawExtracted.metadata.model,
            latencyMs,
            extractionVersion: EXTRACTION_VERSION,
          },
        };

        // 4. Validate output schema consistency
        const validation = validateOpportunity(enriched);
        if (!validation.success) {
          parserStatus = 'INVALID_SCHEMA';
          throw new Error(`INVALID_SCHEMA: ${validation.error}`);
        }

        successfulExtractions++;
        extractions.push(enriched);

        // Detailed log
        console.log(`
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        [Extraction Success]
        URL:           ${page.url}
        Detector:      ${detection.confidence}/100
        Provider:      ${rawExtracted.metadata.provider.toUpperCase()} (${rawExtracted.metadata.model})
        Latency:       ${(latencyMs / 1000).toFixed(1)}s
        Parser Status: ${parserStatus}
        Title:         ${enriched.title}
        Gold Reasons:  ${enriched.goldReasons?.join(', ')}
        Trust Score:   ${enriched.trustScore}/100
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      } catch (err: any) {
        failedExtractions++;

        let conciseReason = 'VALIDATION_FAILED';
        if (err.message.includes('MODEL_EMPTY_RESPONSE')) conciseReason = 'MODEL_EMPTY_RESPONSE';
        else if (err.message.includes('JSON_PARSE_FAILED')) conciseReason = 'JSON_PARSE_FAILED';
        else if (err.message.includes('INVALID_SCHEMA')) conciseReason = 'INVALID_SCHEMA';

        const providerLabel = rawExtracted?.metadata?.provider?.toUpperCase() ?? 'N/A';
        const modelLabel = rawExtracted?.metadata?.model ?? 'N/A';
        const promptTokens = rawExtracted?.usage?.promptTokens ?? 'N/A';
        const completionTokens = rawExtracted?.usage?.completionTokens ?? 'N/A';

        console.error(`
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        [Extraction Failure]
        URL:           ${page.url}
        Detector:      ${detection.confidence}/100
        Provider:      ${providerLabel} (${modelLabel})
        Latency:       ${(latencyMs / 1000).toFixed(1)}s
        Parser Status: ${parserStatus}
        Concise Error: ${conciseReason}
        Details:       ${err.message}
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      }
    }

    DashboardStateInstance.updateState({
      detectorSkipped: pagesSkippedDetector,
      aiProcessed: pagesPassedDetector,
    });

    console.log(`
    ========== Stage 3 Extraction Summary ==========
    Pages Received:          ${crawledPages.length}
    Passed Detector Filter:  ${pagesPassedDetector}
    Skipped by Detector:     ${pagesSkippedDetector}
    Successful Extractions:  ${successfulExtractions}
    Failed Extractions:      ${failedExtractions}
    ================================================`);

    return extractions;
  }
}

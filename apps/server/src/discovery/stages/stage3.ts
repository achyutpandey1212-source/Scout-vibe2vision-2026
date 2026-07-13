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
import { Opportunity } from '../extraction/types/opportunity.types';
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

      try {
        // 2. Route AI call through our rotation-aware Provider Manager
        const rawExtracted = await this.providerManager.generate({
          prompt,
          context: 'discovery',
          temperature: 0.1,
          systemInstruction: EXTRACTION_SYSTEM_INSTRUCTION,
        });

        const parsedData = JSON.parse(rawExtracted.text);

        // 3. Post-Process Normalization & Enrichment
        const normalized = normalizeOpportunity(parsedData);

        // Generate mock raw page ID for pure decoupling
        const rawPageId = new mongoose.Types.ObjectId().toString();
        const latencyMs = Date.now() - startTime;

        const enriched: Opportunity = {
          ...normalized,
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
          throw new Error(`Extracted opportunity failed structural checks: ${validation.error}`);
        }

        successfulExtractions++;
        extractions.push(enriched);
        console.log(
          `[Stage 3] Success: Extracted "${enriched.title}" (Provider: ${rawExtracted.metadata.provider.toUpperCase()})`,
        );
      } catch (err: any) {
        failedExtractions++;
        console.error(`[Stage 3] [Extraction Failed] URL: ${page.url} - Error: ${err.message}`);
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

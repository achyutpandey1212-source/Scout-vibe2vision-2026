import { IPipelineStage } from './pipeline-stage.interface';
import { CrawledPage } from './stage2';
import { OpportunityDetector } from '../utils/opportunity-detector';
import { DiscoveryProviderManager } from '../../ai/gateway/discovery-provider-manager';
import { DashboardStateInstance } from '../utils/dashboard-state';
import { validateOpportunity } from '../extraction/utils/validators';
import { Opportunity, GoldReason } from '../extraction/types/opportunity.types';
import { safeParseJson } from '../../ai/utils/parser';
import { normalizeOpportunity, normalizeString } from '../extraction/utils/normalizers';
import {
  EXTRACTION_SYSTEM_INSTRUCTION,
  buildUserPrompt,
  EXTRACTION_VERSION,
} from '../extraction/prompts/extract-opportunity.prompt';
import { optimizeContext } from '../context';
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

export interface Stage3Analytics {
  pagesReceived: number;
  pagesPassedDetector: number;
  pagesSkippedDetector: number;
  successfulExtractions: number;
  failedExtractions: number;
  totalTokensConsumed: number;
  providerRotations: number;
}

/**
 * Intelligent Markdown Chunker to avoid overflow while maintaining structural integrity.
 * Preserves headings, lists, opportunity cards, and avoids cutting markdown blocks.
 */
export function chunkMarkdown(markdown: string, maxLength = 18000): string {
  if (!markdown || markdown.length <= maxLength) return markdown;

  // Split on double newlines to isolate block paragraphs/elements
  const paragraphs = markdown.split('\n\n');
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxLength) {
      const truncated = paragraph.slice(0, maxLength);
      if (currentChunk.length + truncated.length <= maxLength) {
        currentChunk += truncated + '\n\n';
      }
      break;
    }

    if (currentChunk.length + paragraph.length + 2 > maxLength) {
      break; // Stop before overflowing
    }

    currentChunk += paragraph + '\n\n';
  }

  // Ensure any incomplete code block or table is closed
  if ((currentChunk.match(/```/g) || []).length % 2 !== 0) {
    currentChunk += '```\n';
  }

  return currentChunk.trim();
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

    // 2. High-Quality Gold Opportunity Reason explanations
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
      goldReasons.push('mentorship'); // Remote mentorship alignment
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

    // Categorized failure counts (Task 2 & Task 4)
    let countEmptyResponse = 0;
    let countInvalidJson = 0;
    let countPlaceholderTitle = 0;
    let countSchemaError = 0;
    let countLowInfo = 0;
    let countParserException = 0;
    let countRootHomepage = 0;

    for (const page of crawledPages) {
      if (page.crawlStatus !== 'SUCCESS') {
        console.log(
          `[Stage 3] Skipping page ${page.url} due to Stage 2 crawl status: ${page.crawlStatus}`,
        );
        continue;
      }

      // 1. Inexpensive Deterministic Opportunity Detection pre-filter
      const detection = OpportunityDetector.detect(
        page.url,
        page.title,
        page.markdown,
        options?.categories,
      );

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

      // 1.1 Deterministic Homepage Guard
      let isHomepage = false;
      try {
        const urlObj = new URL(page.url);
        const p = urlObj.pathname;
        isHomepage = p === '/' || p === '' || p === '/index.html' || p === '/index.php';
      } catch {
        // Fallback
      }

      const envHpThreshold = process.env.HOMEPAGE_DETECTOR_THRESHOLD;
      const homepageThreshold = envHpThreshold ? parseInt(envHpThreshold, 10) : 60;

      const strongOpportunityKeywords = [
        'deadline',
        'eligibility',
        'application process',
        'apply link',
        'apply now',
        'how to apply',
        'stipend',
        'salary',
      ];
      const markdownLower = page.markdown.toLowerCase();
      const hasStrongEvidence = strongOpportunityKeywords.some((keyword) =>
        markdownLower.includes(keyword),
      );

      if (isHomepage && detection.confidence < homepageThreshold && !hasStrongEvidence) {
        pagesSkippedDetector++;
        countRootHomepage++;
        console.log(
          `\n[Stage 3] [HOMEPAGE SHORT-CIRCUIT] Skipped generic landing page: ${page.url}`,
        );
        console.log(
          `Reason: URL is root/index path, confidence (${detection.confidence}/100) < threshold (${homepageThreshold}), and no strong opportunity evidence found.`,
        );
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
      // Task 3: Detector log explains why it passed:
      console.log(`Pass Reasons: ${detection.reasons.join('; ')}`);

      // 2. Context Optimization: clean, chunk, score, and compress the page
      //    before sending to Gemini. Falls back gracefully on any failure.
      const { optimizedContent, compressionMetrics } = await optimizeContext(page);

      console.log(
        `[Stage 3] [CONTEXT] Compression: ${compressionMetrics.compressionRatio.toFixed(1)}% | ` +
          `${compressionMetrics.originalChars.toLocaleString()} → ${compressionMetrics.charsSentToGemini.toLocaleString()} chars | ` +
          `~${compressionMetrics.estimatedTokensSaved.toLocaleString()} tokens saved | ` +
          `Jina: ${compressionMetrics.jinaUsed ? (compressionMetrics.jinaFromCache ? 'cache' : 'live') : 'off'}`,
      );

      const startTime = Date.now();
      const prompt = buildUserPrompt(
        page.url,
        page.title,
        optimizedContent,
        14, // legacy relevance score fallback
        'orchestrated query',
      );

      let rawExtracted: any = null;
      let parserStatus = 'PENDING';
      let latencyMs = 0;

      try {
        // Route AI call through Provider Manager
        rawExtracted = await this.providerManager.generate({
          prompt,
          context: 'discovery',
          temperature: 0.1,
          systemInstruction: EXTRACTION_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
        });

        latencyMs = Date.now() - startTime;

        if (!rawExtracted.text || rawExtracted.text.trim() === '') {
          parserStatus = 'REJECTED_EMPTY_RESPONSE';
          countEmptyResponse++;
          throw new Error('REJECTED_EMPTY_RESPONSE: Model output is empty.');
        }

        let parsedData: any;
        try {
          parsedData = safeParseJson(rawExtracted.text);
        } catch (parseErr: any) {
          // Try standard extraction fallback as a last resort
          let fallbackCleaned = rawExtracted.text.trim();
          const firstBrace = fallbackCleaned.indexOf('{');
          const lastBrace = fallbackCleaned.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            fallbackCleaned = fallbackCleaned.substring(firstBrace, lastBrace + 1);
            try {
              parsedData = JSON.parse(fallbackCleaned);
              console.log(`[Stage 3] Recovered JSON parsing via fallback substring extraction.`);
            } catch (innerErr) {
              parserStatus = 'REJECTED_INVALID_JSON';
              countInvalidJson++;
              throw new Error('REJECTED_INVALID_JSON: Failed to parse raw model JSON.');
            }
          } else {
            parserStatus = 'REJECTED_INVALID_JSON';
            countInvalidJson++;
            throw new Error('REJECTED_INVALID_JSON: No JSON braces matched in text.');
          }
        }

        // Check if LLM explicitly filtered page as non-opportunity
        if (parsedData.isOpportunity === false) {
          parserStatus = 'REJECTED_LOW_INFORMATION';
          countLowInfo++;
          throw new Error(
            'REJECTED_LOW_INFORMATION: Page explicitly classified as non-opportunity by LLM.',
          );
        }

        // 3. Post-Process Normalization & Enrichment
        const normalized = normalizeOpportunity(parsedData);
        const appliedNorms = normalized._normalizationChanges || [];

        // Task 2: REJECTED_UNTITLED check
        if (!normalized.title || normalized.title.trim().length === 0) {
          parserStatus = 'REJECTED_UNTITLED';
          countPlaceholderTitle++;
          throw new Error('REJECTED_UNTITLED: Opportunity title is blank or placeholder.');
        }

        // Task 2: REJECTED_LOW_INFORMATION check
        const descriptionLength = normalized.description ? normalized.description.trim().length : 0;
        const summaryLength = normalized.summary ? normalized.summary.trim().length : 0;
        if (descriptionLength < 25 && summaryLength < 25) {
          parserStatus = 'REJECTED_LOW_INFORMATION';
          countLowInfo++;
          throw new Error(
            'REJECTED_LOW_INFORMATION: Extracted fields contain insufficient details.',
          );
        }

        // Generate mock raw page ID for pure decoupling
        const rawPageId = new mongoose.Types.ObjectId().toString();

        // 3.1 Classify trust and gold reasons deterministically
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
          query: (page as any).query,
          _orgTrace: {
            stage3: normalized.organization || '(null)',
          },
        } as any;

        // 4. Validate output schema consistency
        const validation = validateOpportunity(enriched);
        if (!validation.success) {
          parserStatus = 'REJECTED_SCHEMA';
          countSchemaError++;
          // Extract specific validation keys that failed
          const zodDetails = JSON.stringify(validation.error);
          throw new Error(`REJECTED_SCHEMA: Zod constraints failed: ${zodDetails}`);
        }

        // If normalized mappings corrected keys, output warnings for auditing
        if (appliedNorms.length > 0) {
          console.log(`[Stage 3] [NORMALIZATION APPLIED] Normalized aliases for ${page.url}:`);
          appliedNorms.forEach((change: string) => console.log(`  - ${change}`));
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
        Title:         ${enriched.title}
        Trust Score:   ${enriched.trustScore}/100
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      } catch (err: any) {
        if (parserStatus === 'PENDING') {
          parserStatus = 'REJECTED_PARSER_EXCEPTION';
          countParserException++;
        }

        // ── Task 3: Detector / LLM Disagreement Logging ──
        if (
          err.message.includes('REJECTED_LOW_INFORMATION') ||
          parserStatus === 'REJECTED_LOW_INFORMATION'
        ) {
          console.warn(`
================================================================================
DETECTOR / LLM DISAGREEMENT
================================================================================
URL:              ${page.url}
Detector Score:   ${detection.confidence}/100
Detector Reasons:
${detection.reasons.map((r) => `  - ${r}`).join('\n')}
Detector Penalties:
${detection.penalties.map((p) => `  - ${p}`).join('\n')}

LLM Decision:    isOpportunity = false
Category:        Potential False Negative
================================================================================`);
        }

        const providerLabel = rawExtracted?.metadata?.provider?.toUpperCase() ?? 'N/A';
        const modelLabel = rawExtracted?.metadata?.model ?? 'N/A';
        const inputChars = optimizedContent.length;
        const inputTokens = Math.round(inputChars / 4);

        // ── Task 1: Complete Raw Response and Input Observability Logging ──
        console.error(`
================================================================================
RAW EXTRACTION FAILURE DIAGNOSTIC
================================================================================
URL:              ${page.url}
Provider:         ${providerLabel}
Model:            ${modelLabel}
Detector Score:   ${detection.confidence}/100
Prompt Version:   ${EXTRACTION_VERSION}
Characters Sent:  ${inputChars} chars
Token Estimate:   ${inputTokens} tokens
Error Category:   ${parserStatus}
Details:          ${err.message}

--- FIRST 2500 CHARACTERS OF OPTIMIZED CONTENT ---
${optimizedContent.slice(0, 2500)}
------------------------------------------------------

--- ENTIRE RAW MODEL RESPONSE ---
${rawExtracted?.text || 'No response returned from provider.'}
================================================================================`);

        // ── Task 5: Persist failures to disk for future auditing ──
        try {
          const logDir = path.join(
            process.cwd(),
            'logs',
            'extraction-failures',
            new Date().toISOString().split('T')[0],
          );
          fs.mkdirSync(logDir, { recursive: true });
          const fileSafeUrl = page.url.replace(/[^a-z0-9]/gi, '_').substring(0, 100);
          const logPath = path.join(logDir, `${fileSafeUrl}_${Date.now()}_failure.json`);

          fs.writeFileSync(
            logPath,
            JSON.stringify(
              {
                url: page.url,
                provider: providerLabel,
                model: modelLabel,
                detectorScore: detection.confidence,
                promptVersion: EXTRACTION_VERSION,
                charactersSent: inputChars,
                errorCategory: parserStatus,
                errorMessage: err.message,
                pageContent: optimizedContent,
                compressionRatio: compressionMetrics.compressionRatio,
                charsSentToGemini: compressionMetrics.charsSentToGemini,
                jinaUsed: compressionMetrics.jinaUsed,
                rawResponse: rawExtracted?.text || '',
                timestamp: new Date().toISOString(),
              },
              null,
              2,
            ),
          );
        } catch (logWriteErr: any) {
          console.warn(`[Stage 3] Failed to write failure dump: ${logWriteErr.message}`);
        }
      }
    }

    const failedCount = crawledPages.length - pagesSkippedDetector - successfulExtractions;

    DashboardStateInstance.updateState({
      detectorSkipped: pagesSkippedDetector,
      aiProcessed: pagesPassedDetector,
    });

    // ── Task 4: Detailed Summary Log Breakdown ──
    console.log(`
    ================================================
    Stage 3 Extraction Final Summary
    ================================================
    Pages Processed:         ${crawledPages.length}
    Detector Passed:         ${pagesPassedDetector}
    Detector Rejected:       ${pagesSkippedDetector}
    Extraction Success:      ${successfulExtractions}
    Parser Failures:         ${failedCount}
    
    -- Parser Failure Breakdown --
    Root Homepages:          ${countRootHomepage}
    Untitled / Placeholder:  ${countPlaceholderTitle}
    Invalid JSON:            ${countInvalidJson}
    Schema Validation:       ${countSchemaError}
    Low Information Content: ${countLowInfo}
    Empty response text:     ${countEmptyResponse}
    Other parser exceptions: ${countParserException}
    ================================================`);

    return extractions;
  }
}

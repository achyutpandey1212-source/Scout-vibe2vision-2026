import crypto from 'crypto';
import { redis } from '../../config/redis';
import { DISCOVERY_CONFIG } from '../config/discovery.config';
import { FirecrawlClient } from './firecrawl.client';
import { RawPageModel } from './raw-page.model';
import {
  ExtractedPage,
  ExtractionFailure,
  OrchestratorExtractionResponse,
} from './extraction.types';
import { CandidateSearchResult } from '../search/search.types';
import { normalizeUrl } from '../search/search-orchestrator';

/**
 * Deterministically cleans raw Markdown to remove common boilerplate and empty spacing,
 * producing high-density content optimized for LLMs.
 */
export function cleanMarkdown(rawMarkdown: string): string {
  const lines = rawMarkdown.split('\n');
  const cleanedLines: string[] = [];

  const noiseRegex =
    /cookie|privacy policy|terms of service|accept cookies|agree to cookies|share on|follow us|twitter|facebook|instagram|linkedin/i;

  for (const line of lines) {
    const trimmed = line.trim();

    // 1. Remove empty lines from double spacing
    if (!trimmed) {
      cleanedLines.push('');
      continue;
    }

    // 2. Normalize tabs and repeated spaces
    const normalizedSpaces = trimmed.replace(/[ \t]+/g, ' ');

    // 3. Remove cookie banners, social sharing, footer links
    if (noiseRegex.test(normalizedSpaces)) {
      continue;
    }

    cleanedLines.push(normalizedSpaces);
  }

  // Combine, normalize consecutive blank lines to at most one, and trim
  return cleanedLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Computes the SHA256 hash of a text block.
 */
export function computeHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Orchestrator extracting opportunity details from candidate pages using Firecrawl.
 */
export async function extractCandidatePages(
  candidates: CandidateSearchResult[],
): Promise<OrchestratorExtractionResponse> {
  const firecrawlClient = new FirecrawlClient();
  const redisClient = redis.getClient();

  const extracted: ExtractedPage[] = [];
  const failed: ExtractionFailure[] = [];

  let totalLatencyMs = 0;
  let totalMarkdownSize = 0;
  let cacheHits = 0;
  let firecrawlRequests = 0;

  // Limit processing to the top MAX_EXTRACTIONS
  const targetCandidates = candidates.slice(0, DISCOVERY_CONFIG.MAX_EXTRACTIONS);
  console.log(`\nStarting extraction layer for top ${targetCandidates.length} candidate URLs...`);

  // Concurrency chunk limit
  const chunkLimit = DISCOVERY_CONFIG.CONCURRENCY_EXTRACTION;

  for (let i = 0; i < targetCandidates.length; i += chunkLimit) {
    const chunk = targetCandidates.slice(i, i + chunkLimit);

    const chunkPromises = chunk.map(async (candidate) => {
      const url = candidate.url;
      const normalized = normalizeUrl(url);
      const retrievedAt = new Date().toISOString();

      // 1. Skip extraction check: Tavily snippet has enough data and high score
      const snippetLength = candidate.snippet.length;
      const bypassSnippet =
        snippetLength > DISCOVERY_CONFIG.SKIP_EXTRACTION_THRESHOLD.SNIPPET_LENGTH &&
        candidate.score > DISCOVERY_CONFIG.SKIP_EXTRACTION_THRESHOLD.SCORE;

      if (bypassSnippet) {
        const cleaned = cleanMarkdown(candidate.snippet);
        const hash = computeHash(cleaned);

        console.log(`[Bypass Scraping] URL: ${url} (Snippet meets size & score thresholds)`);

        const extractedPage: ExtractedPage = {
          url,
          title: candidate.title,
          markdown: cleaned,
          metadata: {
            description: candidate.snippet,
            domain: candidate.domain,
          },
          extractedAt: retrievedAt,
          source: 'tavily_snippet',
          searchQuery: candidate.queryUsed,
          originalScore: candidate.score,
          needsExtraction: false,
          hash,
        };

        // Persist placeholder raw page to MongoDB immediately
        try {
          await RawPageModel.findOneAndUpdate(
            { url },
            {
              url,
              title: candidate.title,
              markdown: cleaned,
              metadata: extractedPage.metadata,
              crawledAt: new Date(retrievedAt),
              hash,
            },
            { upsert: true, new: true },
          );
        } catch (dbErr: any) {
          console.error(`[DB Error] Failed to persist bypassed page ${url}:`, dbErr.message);
        }

        return { success: true, page: extractedPage };
      }

      // 2. Try Redis Cache check
      const cacheKey = `firecrawl:${normalized}`;
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          cacheHits++;
          console.log(`[Cache Hit] URL: ${url} (Markdown size: ${parsed.markdown.length} bytes)`);

          const extractedPage: ExtractedPage = {
            url,
            title: candidate.title,
            markdown: parsed.markdown,
            metadata: parsed.metadata,
            extractedAt: retrievedAt,
            source: 'firecrawl',
            searchQuery: candidate.queryUsed,
            originalScore: candidate.score,
            needsExtraction: true,
            hash: parsed.hash,
          };

          // Ensure it's in MongoDB RawPage
          try {
            await RawPageModel.findOneAndUpdate(
              { url },
              {
                url,
                title: candidate.title,
                markdown: parsed.markdown,
                metadata: parsed.metadata,
                crawledAt: new Date(retrievedAt),
                hash: parsed.hash,
              },
              { upsert: true, new: true },
            );
          } catch (dbErr: any) {
            console.error(`[DB Error] Failed to ensure cached page ${url}:`, dbErr.message);
          }

          return { success: true, page: extractedPage };
        }
      } catch (cacheErr: any) {
        console.error(`[Cache Error] Failed checking Redis for ${url}:`, cacheErr.message);
      }

      // 3. Firecrawl Scrape API call
      console.log(`[Scraping...] URL: ${url}`);
      const startTime = Date.now();
      firecrawlRequests++;

      try {
        const scrapeResponse = await firecrawlClient.scrape(url);
        const latency = Date.now() - startTime;

        const rawMarkdown = scrapeResponse.data.markdown;
        const cleanedMarkdown = cleanMarkdown(rawMarkdown);
        const hash = computeHash(cleanedMarkdown);

        console.log(
          `[Success] URL: ${url} (Markdown length: ${cleanedMarkdown.length} bytes, latency: ${(latency / 1000).toFixed(1)}s)`,
        );

        const metadata = {
          description: scrapeResponse.data.metadata.description,
          language: scrapeResponse.data.metadata.language,
          author: scrapeResponse.data.metadata.author,
          publishedDate: scrapeResponse.data.metadata.publishedDate,
          image: scrapeResponse.data.metadata.ogImage,
          domain: candidate.domain,
        };

        const extractedPage: ExtractedPage = {
          url,
          title: candidate.title,
          markdown: cleanedMarkdown,
          metadata,
          extractedAt: retrievedAt,
          source: 'firecrawl',
          searchQuery: candidate.queryUsed,
          originalScore: candidate.score,
          needsExtraction: true,
          hash,
        };

        // Cache page details in Redis
        try {
          await redisClient.setex(
            cacheKey,
            DISCOVERY_CONFIG.FIRECRAWL_CACHE_TTL_SECONDS,
            JSON.stringify({
              markdown: cleanedMarkdown,
              metadata,
              hash,
            }),
          );
        } catch (cacheSetErr: any) {
          console.error(`[Cache Error] Failed writing Redis for ${url}:`, cacheSetErr.message);
        }

        // Save raw crawled page details to MongoDB RawPage immediately
        try {
          await RawPageModel.findOneAndUpdate(
            { url },
            {
              url,
              title: candidate.title,
              markdown: cleanedMarkdown,
              metadata,
              crawledAt: new Date(retrievedAt),
              hash,
            },
            { upsert: true, new: true },
          );
        } catch (dbErr: any) {
          console.error(`[DB Error] Failed saving page ${url} to MongoDB:`, dbErr.message);
        }

        return { success: true, page: extractedPage, latency, size: cleanedMarkdown.length };
      } catch (err: any) {
        console.error(`[Failed] URL: ${url} (Reason: ${err.message})`);
        return {
          success: false,
          failure: {
            url,
            reason: err.message,
            stage: 'firecrawl',
            retries: DISCOVERY_CONFIG.FIRECRAWL_RETRIES,
          } as ExtractionFailure,
        };
      }
    });

    const chunkResults = await Promise.all(chunkPromises);

    for (const res of chunkResults) {
      if (res.success && res.page) {
        extracted.push(res.page);
        if (res.latency) {
          totalLatencyMs += res.latency;
        }
        if (res.size) {
          totalMarkdownSize += res.size;
        }
      } else if (res.failure) {
        failed.push(res.failure);
      }
    }
  }

  const successCount = extracted.length;
  const avgLatency = successCount > 0 ? (totalLatencyMs / successCount / 1000).toFixed(2) : '0.00';
  const avgMarkdownSize = successCount > 0 ? Math.round(totalMarkdownSize / successCount) : 0;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Firecrawl Extraction Metrics Summary:');
  console.log(`Pages received:      ${targetCandidates.length}`);
  console.log(`Pages extracted:     ${successCount}`);
  console.log(`Cache hits:          ${cacheHits}`);
  console.log(`Firecrawl requests:  ${firecrawlRequests}`);
  console.log(`Failures:            ${failed.length}`);
  console.log(`Avg extraction time: ${avgLatency}s`);
  console.log(`Avg markdown size:   ${avgMarkdownSize} bytes`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return {
    extracted,
    failed,
  };
}

import { ProviderPoolFactory } from '../../lib/providers/provider-pool-factory';
import { DISCOVERY_CONFIG } from '../config/discovery.config';
import { FirecrawlScrapeResponseSchema } from './extraction.schema';
import { z } from 'zod';

export type FirecrawlScrapeResponse = z.infer<typeof FirecrawlScrapeResponseSchema>;

export class FirecrawlClient {
  private readonly baseUrl = 'https://api.firecrawl.dev/v1/scrape';

  constructor() {
    const key = ProviderPoolFactory.discovery('firecrawl').getCurrentKey();
    if (!key) {
      throw new Error('Missing FIRECRAWL_API_KEY in environment configuration');
    }
  }

  /**
   * Scrapes webpage content using Firecrawl.
   */
  async scrape(url: string): Promise<FirecrawlScrapeResponse> {
    const pool = ProviderPoolFactory.discovery('firecrawl');
    const body = {
      url,
      formats: ['markdown'],
      onlyMainContent: true,
    };

    const maxAttempts = DISCOVERY_CONFIG.FIRECRAWL_RETRIES + 1;
    const timeoutMs = DISCOVERY_CONFIG.FIRECRAWL_TIMEOUT;
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const activeKey = pool.getCurrentKey();

      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const status = response.status;
          const text = await response.text().catch(() => 'No body content');
          const textLower = text.toLowerCase();

          const isUnsupported =
            status === 403 ||
            textLower.includes('unsupported site') ||
            textLower.includes('do not support this site') ||
            textLower.includes('we do not support') ||
            textLower.includes('blocked') ||
            textLower.includes('forbidden');

          if (isUnsupported) {
            throw new Error(
              `BLOCKED: Firecrawl blocked or unsupported site (HTTP ${status}): ${text}`,
            );
          }

          if (status === 401 || status === 429) {
            pool.markFailure();
            pool.rotate();
          }

          if (status === 401) {
            throw new Error(`Firecrawl API responded with HTTP error 401: Unauthorized API Key`);
          }

          if (status >= 500 || status === 429) {
            console.warn(
              `[Firecrawl Client] Transient error (HTTP ${status}) on attempt ${attempt}. Retrying... Details: ${text}`,
            );
            if (attempt < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
              continue;
            }
          }
          throw new Error(`Firecrawl API responded with HTTP error ${status}: ${text}`);
        }

        const data = await response.json();
        const parseResult = FirecrawlScrapeResponseSchema.safeParse(data);
        if (!parseResult.success) {
          throw new Error(`Invalid schema returned by Firecrawl: ${parseResult.error.message}`);
        }

        pool.markSuccess();
        return parseResult.data;
      } catch (error: any) {
        clearTimeout(timeoutId);

        if (error.message && error.message.startsWith('BLOCKED:')) {
          throw error;
        }

        const isAbort = error.name === 'AbortError';
        const errorMsg = isAbort ? `Request timed out after ${timeoutMs}ms` : error.message;

        if (attempt < maxAttempts) {
          pool.markFailure();
          pool.rotate();
          console.warn(
            `[Firecrawl Client] Failed attempt ${attempt}/${maxAttempts}: ${errorMsg}. Retrying...`,
          );
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          continue;
        }

        throw new Error(
          `Failed to scrape page via Firecrawl after ${maxAttempts} attempts. Error: ${errorMsg}`,
        );
      }
    }

    throw new Error('Failed to scrape page via Firecrawl after maximum attempts');
  }
}

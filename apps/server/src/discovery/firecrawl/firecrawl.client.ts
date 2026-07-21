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
      formats: ['markdown', 'html'],
      onlyMainContent: true,
    };

    const keysCount = pool.getKeys ? pool.getKeys().length : 1;
    const maxAttempts = Math.max(keysCount, DISCOVERY_CONFIG.FIRECRAWL_RETRIES + 1);
    const timeoutMs = DISCOVERY_CONFIG.FIRECRAWL_TIMEOUT;
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const activeKey = pool.getCurrentKey();
      const telemetry = pool.getTelemetry();

      console.log(
        `[Firecrawl Client] Executing request with key (${telemetry.activeIndex + 1}/${telemetry.totalKeys})`,
      );

      console.log(`
Firecrawl Request URL:
${url}
`);

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

          if (status === 401) {
            throw new Error(`Firecrawl API responded with HTTP error 401: Unauthorized API Key`);
          }

          if (status === 402) {
            throw new Error(`Firecrawl API responded with HTTP error 402: Insufficient credits`);
          }

          if (status === 429) {
            throw new Error(`Firecrawl API responded with HTTP error 429: Rate limit exceeded`);
          }

          throw new Error(`Firecrawl API responded with HTTP error ${status}: ${text}`);
        }

        const data = await response.json();

        // RAW FIRECRAWL RESULT Debug Logging
        const rawSuccess = data?.success ?? false;
        const rawMarkdown = data?.data?.markdown ?? '';
        const rawHtml = data?.data?.html ?? '';
        const rawMeta = data?.data?.metadata ?? {};
        const rawTitle = rawMeta?.title ?? 'null';

        console.log(`
============================
RAW FIRECRAWL RESULT
============================
URL:
${url}
Success:
${rawSuccess}
HTTP Status:
${response.status}
Error:
${data?.error || 'null'}
Has markdown:
${!!rawMarkdown}
Markdown length:
${rawMarkdown.length}
Has html:
${!!rawHtml}
HTML length:
${rawHtml.length}
Metadata:
${JSON.stringify(rawMeta)}
Raw title:
${rawTitle}
First 500 markdown chars:
${rawMarkdown.substring(0, 500)}
First 500 html chars:
${rawHtml.substring(0, 500)}
============================
`);

        const parseResult = FirecrawlScrapeResponseSchema.safeParse(data);
        if (!parseResult.success) {
          throw new Error(`Invalid schema returned by Firecrawl: ${parseResult.error.message}`);
        }

        pool.markSuccess();
        return parseResult.data;
      } catch (error: any) {
        clearTimeout(timeoutId);

        console.log(`
============================
RAW FIRECRAWL RESULT
============================
URL:
${url}
Success:
false
HTTP Status:
Unknown (Network/Error)
Error:
${error.message || error}
Has markdown:
false
Markdown length:
0
Has html:
false
HTML length:
0
Metadata:
{}
Raw title:
null
First 500 markdown chars:
null
First 500 html chars:
null
============================
`);

        if (error.message && error.message.startsWith('BLOCKED:')) {
          throw error;
        }

        const isAbort = error.name === 'AbortError';
        const errorMsg = isAbort ? `Request timed out after ${timeoutMs}ms` : error.message;

        if (attempt < maxAttempts) {
          pool.markFailure();
          pool.rotate();
          console.warn(
            `[Firecrawl Client] Failed attempt ${attempt}/${maxAttempts}: ${errorMsg}. Retrying with rotated key...`,
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
export default FirecrawlClient;

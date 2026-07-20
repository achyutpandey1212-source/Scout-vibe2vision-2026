import { redis } from '../../config/redis';
import { sourceRegistryService } from './source-registry.service';

const AFFILIATE_QUEUE_KEY = 'scout:affiliate:queue';

// Domains that are known noise — social media, CDNs, analytics, etc.
const BLOCKLISTED_AFFILIATE_DOMAINS = new Set([
  'google.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'linkedin.com',
  'youtube.com',
  'github.com',
  'wikipedia.org',
  'medium.com',
  'substack.com',
  'reddit.com',
  'whatsapp.com',
  'telegram.org',
  // CDNs & analytics
  'cloudflare.com',
  'cloudfront.net',
  'akamaized.net',
  'amazonaws.com',
  'googleapis.com',
  'googletagmanager.com',
  'doubleclick.net',
  'analytics.google.com',
  'hotjar.com',
  'sentry.io',
  // Email providers
  'mailchimp.com',
  'sendgrid.com',
  'constantcontact.com',
  // Generic utility
  'bit.ly',
  'tinyurl.com',
  'ow.ly',
  't.co',
  'goo.gl',
]);

// Headings that commonly introduce partner/sponsor/affiliate sections
const PARTNER_HEADING_PATTERNS = [
  /##?\s+(our\s+)?(partners|sponsors|supporters|affiliates|collaborators)/i,
  /##?\s+(affiliated|associated)\s+(organizations?|institutions?|programs?)/i,
  /##?\s+(resources|useful\s+links|related\s+(programs?|organizations?))/i,
  /##?\s+(funders?|donors?|grantors?)/i,
];

// ─── AffiliateExtractor ───────────────────────────────────────────────────────

export class AffiliateExtractor {
  /**
   * Parses crawled markdown to extract external domains that may be partner or
   * affiliated organizations. These are candidate domains for the Source Registry.
   *
   * Only extracts from partner/sponsor/resource sections and outbound markdown links.
   * Returns unique, clean domain strings.
   */
  static extract(markdown: string, sourceDomain: string): string[] {
    if (!markdown || markdown.trim().length < 100) return [];

    const lines = markdown.split('\n');
    const extractedDomains = new Set<string>();

    let inPartnerSection = false;

    for (const line of lines) {
      // Detect entry into a partner/sponsor/resource section
      const isHeading = line.trim().startsWith('#');
      if (isHeading) {
        const matchesPartnerSection = PARTNER_HEADING_PATTERNS.some((pattern) =>
          pattern.test(line),
        );
        inPartnerSection = matchesPartnerSection;
      }

      // Extract all markdown links from the line
      const linkPattern = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
      let match: RegExpExecArray | null;

      while ((match = linkPattern.exec(line)) !== null) {
        const url = match[2];

        // Only extract if in a partner section or it's a raw outbound link
        if (!inPartnerSection && !isOutboundLink(url, sourceDomain)) continue;

        const domain = extractDomain(url);
        if (domain) extractedDomains.add(domain);
      }

      // Also scan for bare URLs in partner sections
      if (inPartnerSection) {
        const bareUrlPattern = /https?:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi;
        let bareMatch: RegExpExecArray | null;
        while ((bareMatch = bareUrlPattern.exec(line)) !== null) {
          const domain = extractDomain(`https://${bareMatch[1]}`);
          if (domain) extractedDomains.add(domain);
        }
      }
    }

    // Filter: remove source domain itself, blocklisted domains, and subdomains of source
    const sourceDomainClean = normalizeDomain(sourceDomain);
    return Array.from(extractedDomains).filter((d) => {
      if (!d || d === sourceDomainClean) return false;
      if (d.endsWith(`.${sourceDomainClean}`)) return false;
      if (BLOCKLISTED_AFFILIATE_DOMAINS.has(d)) return false;
      if (d.length < 4 || !d.includes('.')) return false;
      return true;
    });
  }

  /**
   * Queues candidate affiliate domains into Redis for the weekly discovery engine.
   * Uses a Redis Set for automatic deduplication.
   * Returns the number of newly queued domains.
   */
  static async queue(domains: string[], sourceDomain: string): Promise<number> {
    if (domains.length === 0) return 0;

    try {
      const redisClient = redis.getClient();

      // Filter out already-registered domains before queuing
      const newDomains: string[] = [];
      for (const domain of domains) {
        const exists = await sourceRegistryService.domainExists(domain);
        if (!exists) newDomains.push(domain);
      }

      if (newDomains.length === 0) return 0;

      await redisClient.sadd(AFFILIATE_QUEUE_KEY, ...newDomains);
      console.log(
        `[AffiliateExtractor] Queued ${newDomains.length} new domains from ${sourceDomain}`,
      );
      return newDomains.length;
    } catch (err: any) {
      // Non-fatal: affiliate queueing failures must never affect the crawl pipeline
      console.error(`[AffiliateExtractor] Failed to queue domains: ${err.message}`);
      return 0;
    }
  }

  /**
   * Reads all queued domains without draining or modifying the queue.
   */
  static async getQueueItems(): Promise<string[]> {
    try {
      const redisClient = redis.getClient();
      return await redisClient.smembers(AFFILIATE_QUEUE_KEY);
    } catch (err: any) {
      console.error(`[AffiliateExtractor] Failed to fetch queue items: ${err.message}`);
      return [];
    }
  }

  /**
   * Removes specific processed domains from the Redis queue immediately.
   */
  static async removeFromQueue(domains: string[]): Promise<number> {
    if (!domains || domains.length === 0) return 0;
    try {
      const redisClient = redis.getClient();
      const removed = await redisClient.srem(AFFILIATE_QUEUE_KEY, ...domains);
      console.log(`[AffiliateExtractor] Removed ${removed} processed domains from affiliate queue`);
      return removed;
    } catch (err: any) {
      console.error(`[AffiliateExtractor] Failed to remove domains from queue: ${err.message}`);
      return 0;
    }
  }

  /**
   * Drains the affiliate queue from Redis and returns all queued domains.
   * Called by legacy routines.
   */
  static async drainQueue(): Promise<string[]> {
    try {
      const redisClient = redis.getClient();
      const members = await redisClient.smembers(AFFILIATE_QUEUE_KEY);

      if (members.length > 0) {
        await redisClient.del(AFFILIATE_QUEUE_KEY);
        console.log(`[AffiliateExtractor] Drained ${members.length} domains from affiliate queue`);
      }

      return members;
    } catch (err: any) {
      console.error(`[AffiliateExtractor] Failed to drain queue: ${err.message}`);
      return [];
    }
  }

  /**
   * Returns the current depth (size) of the affiliate queue without draining.
   */
  static async getQueueDepth(): Promise<number> {
    try {
      const redisClient = redis.getClient();
      return await redisClient.scard(AFFILIATE_QUEUE_KEY);
    } catch {
      return 0;
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return normalizeDomain(parsed.hostname);
  } catch {
    return null;
  }
}

function normalizeDomain(domain: string): string {
  return domain.toLowerCase().replace(/^www\./, '');
}

function isOutboundLink(url: string, sourceDomain: string): boolean {
  try {
    const parsed = new URL(url);
    const linkDomain = normalizeDomain(parsed.hostname);
    const ownDomain = normalizeDomain(sourceDomain);
    return !linkDomain.endsWith(ownDomain) && linkDomain !== ownDomain;
  } catch {
    return false;
  }
}

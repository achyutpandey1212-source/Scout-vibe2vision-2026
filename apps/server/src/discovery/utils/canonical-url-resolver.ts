import crypto from 'crypto';

export class CanonicalUrlResolver {
  private static readonly trackingParams = new Set([
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'utm_id',
    'utm_cid',
    'gclid',
    'dclid',
    'wbraid',
    'gbraid',
    'fbclid',
    'msclkid',
    'twclid',
    'ttclid',
    'yclid',
    '_hsenc',
    '_hsmi',
    'mc_cid',
    'mc_eid',
    'ref',
    'referrer',
    'source',
    'origin',
    'trackingid',
    'tracking',
    'clickid',
    'spreportid',
    'spjobid',
    'spqueueid',
    'spuserid',
  ]);

  /**
   * Deterministically cleans query parameters and standardizes the URL.
   */
  public static clean(urlStr: string | null | undefined): string {
    if (!urlStr) return '';
    try {
      const url = new URL(urlStr.trim());

      // Clean query parameters
      const params = new URLSearchParams();
      url.searchParams.forEach((value, key) => {
        if (!this.trackingParams.has(key.toLowerCase())) {
          params.append(key, value);
        }
      });

      const search = params.toString();
      url.search = search ? `?${search}` : '';
      url.hash = '';

      // Standardize hostname: lowercase and strip www.
      url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');

      // Standardize path: remove trailing slash
      let pathname = url.pathname;
      if (pathname.endsWith('/') && pathname.length > 1) {
        pathname = pathname.slice(0, -1);
      }
      url.pathname = pathname;

      return url.toString();
    } catch {
      return (urlStr || '').trim().toLowerCase();
    }
  }

  /**
   * Generates a unique SHA-256 hash for a canonical URL.
   */
  public static generateHash(urlStr: string): string {
    const canonical = this.clean(urlStr);
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }
}

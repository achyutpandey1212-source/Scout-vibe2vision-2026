import { ORGANIZATION_REGISTRY, RegistryOrgEntry } from './organization-registry';
import { OrganizationType, OrganizationStage } from '../extraction/types/opportunity.types';

export interface ResolvedOrganization {
  organization: string;
  organizationType: OrganizationType;
  organizationStage: OrganizationStage | null;
}

export class OrganizationResolver {
  private static readonly mncKeywords = [
    'google',
    'microsoft',
    'netflix',
    'amazon',
    'apple',
    'meta',
    'facebook',
    'stripe',
    'uber',
    'github',
    'oracle',
    'salesforce',
    'adobe',
    'intel',
    'nvidia',
    'amd',
    'cisco',
    'ibm',
    'hcl',
    'infosys',
    'tcs',
    'wipro',
    'cognizant',
    'accenture',
    'capgemini',
    'deloitte',
    'ey',
    'pwc',
    'kpmg',
    'jpmorgan',
    'goldman',
    'morgan stanley',
    'barclays',
    'hsbc',
    'citi',
    'walmart',
    'target',
    'flipkart',
    'phonepe',
    'paytm',
  ];

  /**
   * Main entry point to resolve organization name and metadata.
   */
  public static resolve(
    opp: { organization: string; sourceURL?: string; title?: string },
    page?: { title?: string; markdown?: string; metadata?: any },
  ): ResolvedOrganization {
    // 1. Try registry lookup by URL domain first
    if (opp.sourceURL) {
      const byDomain = this.lookupRegistryByUrl(opp.sourceURL);
      if (byDomain) return byDomain;
    }

    // 2. Try registry lookup by input organization name/alias
    if (opp.organization && this.isValidName(opp.organization)) {
      const byName = this.lookupRegistryByName(opp.organization);
      if (byName) return byName;
    }

    // 3. Level 1: Structured Metadata
    let org = this.resolveLevel1(page?.metadata);
    if (org && this.isValidName(org)) {
      return this.enrichDetails(this.normalizeAlias(org), opp.sourceURL);
    }

    // 4. Level 2: OpenGraph
    org = this.resolveLevel2(page?.metadata);
    if (org && this.isValidName(org)) {
      return this.enrichDetails(this.normalizeAlias(org), opp.sourceURL);
    }

    // 5. Level 3: Company Logo Alt Text
    org = this.resolveLevel3(page?.markdown);
    if (org && this.isValidName(org)) {
      return this.enrichDetails(this.normalizeAlias(org), opp.sourceURL);
    }

    // 6. Level 4: H1
    org = this.resolveLevel4(page?.markdown);
    if (org && this.isValidName(org)) {
      return this.enrichDetails(this.normalizeAlias(org), opp.sourceURL);
    }

    // 7. Level 5: Title Parsing
    org = this.resolveLevel5(page?.title || page?.metadata?.title);
    if (org && this.isValidName(org)) {
      return this.enrichDetails(this.normalizeAlias(org), opp.sourceURL);
    }

    // 8. Level 6: Known ATS Subdomains / Paths (Lever, Greenhouse, Ashby, SmartRecruiters)
    if (opp.sourceURL) {
      org = this.resolveLevel6(opp.sourceURL);
      if (org && this.isValidName(org)) {
        return this.enrichDetails(this.normalizeAlias(org), opp.sourceURL);
      }
    }

    // 9. Level 7: LLM Fallback (the pre-extracted organization name)
    const fallbackOrg = opp.organization;
    if (fallbackOrg && this.isValidName(fallbackOrg)) {
      return this.enrichDetails(this.normalizeAlias(fallbackOrg), opp.sourceURL);
    }

    // Last Resort Fallback: Extract from domain name
    return this.enrichDetails(this.resolveDomainFallback(opp.sourceURL), opp.sourceURL);
  }

  private static isValidName(name: string): boolean {
    if (!name) return false;
    const lower = name.trim().toLowerCase();
    const banned = new Set([
      'unknown',
      'unknown organization',
      'unknown_organization',
      'n/a',
      'none',
      'null',
      'undefined',
      'careers',
      'jobs',
      'home',
      'dashboard',
      'apply',
      'opportunity',
      'internship',
      'scholarship',
    ]);
    if (banned.has(lower)) return false;
    if (lower.length < 2) return false;
    return true;
  }

  private static normalizeAlias(name: string): string {
    const clean = name.trim();
    const lower = clean.toLowerCase();

    // 1. Direct registry alias mapping check
    for (const entry of ORGANIZATION_REGISTRY) {
      if (entry.name.toLowerCase() === lower || entry.aliases.includes(lower)) {
        return entry.name;
      }
    }

    // 2. Generic cleaning for suffixes
    return clean
      .replace(
        /\b(llc|ltd|inc|corp|corporation|india|pvt|private|co|group|solutions|technologies|tech)\b/gi,
        '',
      )
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static lookupRegistryByUrl(urlStr: string): ResolvedOrganization | null {
    try {
      const url = new URL(urlStr);
      const hostname = url.hostname.toLowerCase().replace(/^www\./, '');

      for (const entry of ORGANIZATION_REGISTRY) {
        if (entry.domains.some((d) => hostname === d || hostname.endsWith('.' + d))) {
          return {
            organization: entry.name,
            organizationType: entry.type,
            organizationStage: entry.stage,
          };
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  private static lookupRegistryByName(orgName: string): ResolvedOrganization | null {
    const lower = orgName.trim().toLowerCase();
    for (const entry of ORGANIZATION_REGISTRY) {
      if (entry.name.toLowerCase() === lower || entry.aliases.includes(lower)) {
        return {
          organization: entry.name,
          organizationType: entry.type,
          organizationStage: entry.stage,
        };
      }
    }
    return null;
  }

  private static resolveLevel1(metadata: any): string | null {
    if (!metadata) return null;
    const candidates = [
      metadata['organization.name'],
      metadata.organization,
      metadata['schemaOrg.organization.name'],
      metadata.publisher,
      metadata.author,
      metadata.brand,
    ];
    for (const cand of candidates) {
      if (typeof cand === 'string' && cand) return cand.trim();
    }

    const jsonLdStr = metadata.jsonLd || metadata.jsonld;
    if (jsonLdStr && typeof jsonLdStr === 'string') {
      try {
        const json = JSON.parse(jsonLdStr);
        const found = this.findOrgInJsonLd(json);
        if (found) return found;
      } catch {
        // ignore
      }
    }
    return null;
  }

  private static findOrgInJsonLd(obj: any): string | null {
    if (!obj || typeof obj !== 'object') return null;
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const found = this.findOrgInJsonLd(item);
        if (found) return found;
      }
      return null;
    }
    if (obj['@type'] === 'Organization' && typeof obj.name === 'string') {
      return obj.name;
    }
    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        const found = this.findOrgInJsonLd(obj[key]);
        if (found) return found;
      }
    }
    return null;
  }

  private static resolveLevel2(metadata: any): string | null {
    if (!metadata) return null;
    const candidates = [
      metadata['og:site_name'],
      metadata.ogSiteName,
      metadata.siteName,
      metadata.site_name,
      metadata['og:publisher'],
    ];
    for (const cand of candidates) {
      if (typeof cand === 'string' && cand) return cand.trim();
    }
    return null;
  }

  private static resolveLevel3(markdown: string | undefined): string | null {
    if (!markdown) return null;
    const imgRegex = /!\[([^\]]*(?:logo|brand|icon|header)[^\]]*)\]/gi;
    let match;
    while ((match = imgRegex.exec(markdown)) !== null) {
      const altText = match[1].trim();
      const cleaned = altText
        .replace(/\b(logo|brand|icon|header|dark|light|horizontal|vertical|png|jpg|svg)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleaned && this.isValidName(cleaned) && cleaned.length < 50) {
        return cleaned;
      }
    }
    return null;
  }

  private static resolveLevel4(markdown: string | undefined): string | null {
    if (!markdown) return null;
    const lines = markdown.split('\n');
    for (const line of lines) {
      if (line.startsWith('# ')) {
        const h1 = line.slice(2).trim();
        if (h1 && this.isValidName(h1) && h1.length < 60) {
          const cleaned = h1
            .replace(/\b(careers?|jobs?|internships?|opportunities?|openings?)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
          if (cleaned && this.isValidName(cleaned)) return cleaned;
        }
        break; // Stop at first H1
      }
    }
    return null;
  }

  private static resolveLevel5(title: string | undefined): string | null {
    if (!title) return null;
    const separators = [' | ', ' - ', ' – ', ' — ', ' at ', ' @ '];
    for (const sep of separators) {
      if (title.includes(sep)) {
        const parts = title.split(sep);
        const first = parts[0].trim();
        const last = parts[parts.length - 1].trim();
        const hasJobKeywords = (s: string) =>
          /\b(careers?|jobs?|internships?|hiring|work|opportunities?)\b/i.test(s);

        if (hasJobKeywords(first) && !hasJobKeywords(last)) {
          const cleaned = first
            .replace(/\b(careers?\s+at|jobs?\s+at|careers?|jobs?)\b/gi, '')
            .trim();
          if (cleaned && this.isValidName(cleaned)) return cleaned;
          if (this.isValidName(last)) return last;
        } else if (!hasJobKeywords(first) && hasJobKeywords(last)) {
          const cleaned = last.replace(/\b(careers?|jobs?|hiring|opportunities?)\b/gi, '').trim();
          if (cleaned && this.isValidName(cleaned)) return cleaned;
          if (this.isValidName(first)) return first;
        } else {
          if (this.isValidName(last) && last.length < first.length) return last;
          if (this.isValidName(first)) return first;
        }
      }
    }
    return null;
  }

  private static resolveLevel6(urlStr: string): string | null {
    try {
      const url = new URL(urlStr);
      const hostname = url.hostname.toLowerCase().replace(/^www\./, '');

      if (hostname.includes('lever.co')) {
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) return this.capitalize(pathParts[0]);
      }
      if (hostname.includes('greenhouse.io')) {
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts.includes('embed') || pathParts.includes('boards')) {
          const index = pathParts.findIndex((p) => p === 'embed' || p === 'boards');
          if (index !== -1 && pathParts[index + 1]) {
            return this.capitalize(pathParts[index + 1]);
          }
        }
        if (pathParts.length > 0) return this.capitalize(pathParts[0]);
      }
      if (hostname.includes('ashbyhq.com')) {
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) return this.capitalize(pathParts[0]);
      }
      if (hostname.includes('smartrecruiters.com')) {
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) return this.capitalize(pathParts[0]);
      }
    } catch {
      // ignore
    }
    return null;
  }

  private static resolveDomainFallback(urlStr?: string): string {
    if (!urlStr) return 'Unknown Organization';
    try {
      const url = new URL(urlStr);
      const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        const name = parts[parts.length - 2];
        if (name && name !== 'com' && name !== 'co' && name !== 'org' && name !== 'net') {
          return this.capitalize(name);
        }
      }
      return this.capitalize(parts[0]);
    } catch {
      return 'Unknown Organization';
    }
  }

  private static enrichDetails(orgName: string, urlStr?: string): ResolvedOrganization {
    const org = orgName.trim();
    const orgLower = org.toLowerCase();

    let type: OrganizationType = 'OTHER';
    let stage: OrganizationStage | null = null;

    const isGov =
      orgLower.includes('government') ||
      orgLower.includes('ministry') ||
      (urlStr && (urlStr.includes('.gov') || urlStr.includes('.nic.in')));
    const isEdu =
      orgLower.includes('university') ||
      orgLower.includes('institute') ||
      orgLower.includes('college') ||
      orgLower.includes('iit') ||
      orgLower.includes('iiit') ||
      orgLower.includes('nit') ||
      (urlStr && (urlStr.includes('.edu') || urlStr.includes('.ac.in')));
    const isNgo =
      orgLower.includes('ngo') || orgLower.includes('foundation') || orgLower.includes('trust');
    const isMnc = this.mncKeywords.some((kw) => orgLower.includes(kw));

    if (isGov) {
      type = 'GOVERNMENT';
      stage = 'GOVERNMENT';
    } else if (isEdu) {
      type = 'UNIVERSITY';
      stage = 'ACADEMIC';
    } else if (isNgo) {
      type = 'NGO';
      stage = null;
    } else if (isMnc) {
      type = 'MNC';
      stage = 'ENTERPRISE';
    } else {
      if (
        urlStr &&
        (urlStr.includes('lever.co') ||
          urlStr.includes('greenhouse.io') ||
          urlStr.includes('ashbyhq.com') ||
          urlStr.includes('yc'))
      ) {
        type = 'STARTUP';
        stage = 'GROWTH_STARTUP';
      } else {
        type = 'OTHER';
        stage = null;
      }
    }

    return {
      organization: org,
      organizationType: type,
      organizationStage: stage,
    };
  }

  private static capitalize(s: string): string {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

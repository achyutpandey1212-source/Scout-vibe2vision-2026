import { ATSProvider, CompanyCandidate, CompanyRecord } from './company.types';
import { seedToCandidate, ECOSYSTEMS } from './ecosystem-config';
import { CompanyRegistry } from './company-registry';

/**
 * Curated startup registry.
 *
 * Maintains the explicit "known unicorn" and high-value Indian/global startup
 * list (deterministic). Provides a fast lookup so the discovery engine can
 * recognize a company as a unicorn even when discovered via an external source
 * rather than via its curated ecosystem entry.
 */

export interface UnicornEntry {
  name: string;
  website: string;
  country: string;
  city?: string;
  ats?: ATSProvider;
}

export const UNICORN_REGISTRY: UnicornEntry[] = [
  {
    name: 'Razorpay',
    website: 'https://razorpay.com',
    country: 'India',
    city: 'Bengaluru',
    ats: 'Greenhouse',
  },
  { name: 'Meesho', website: 'https://meesho.com', country: 'India', city: 'Bengaluru' },
  { name: 'CRED', website: 'https://cred.club', country: 'India', city: 'Bengaluru' },
  { name: 'Zepto', website: 'https://zepto.com', country: 'India', city: 'Mumbai' },
  { name: 'Groww', website: 'https://groww.in', country: 'India', city: 'Bengaluru' },
  {
    name: 'BrowserStack',
    website: 'https://browserstack.com',
    country: 'India',
    city: 'Mumbai',
    ats: 'Greenhouse',
  },
  {
    name: 'Postman',
    website: 'https://postman.com',
    country: 'India',
    city: 'Bengaluru',
    ats: 'Greenhouse',
  },
  { name: 'PhonePe', website: 'https://phonepe.com', country: 'India', city: 'Bengaluru' },
  {
    name: 'Juspay',
    website: 'https://juspay.in',
    country: 'India',
    city: 'Bengaluru',
    ats: 'Greenhouse',
  },
  { name: 'Unacademy', website: 'https://unacademy.com', country: 'India', city: 'Bengaluru' },
  { name: 'ShareChat', website: 'https://sharechat.com', country: 'India', city: 'Bengaluru' },
  { name: 'ElasticRun', website: 'https://elastic.run', country: 'India', city: 'Pune' },
  { name: 'OfBusiness', website: 'https://ofbusiness.com', country: 'India', city: 'Gurugram' },
  {
    name: 'Freshworks',
    website: 'https://freshworks.com',
    country: 'India',
    city: 'Chennai',
    ats: 'Workable',
  },
  {
    name: 'Chargebee',
    website: 'https://chargebee.com',
    country: 'India',
    city: 'Chennai',
    ats: 'Greenhouse',
  },
];

const UNICORN_BY_NAME = new Map<string, UnicornEntry>();
const UNICORN_BY_HOST = new Map<string, UnicornEntry>();

for (const u of UNICORN_REGISTRY) {
  UNICORN_BY_NAME.set(u.name.toLowerCase(), u);
  try {
    UNICORN_BY_HOST.set(new URL(u.website).hostname.toLowerCase().replace(/^www\./, ''), u);
  } catch {
    // ignore
  }
}

export function isKnownUnicorn(nameOrHost: string): boolean {
  const key = nameOrHost.toLowerCase().replace(/^www\./, '');
  if (UNICORN_BY_NAME.has(key)) return true;
  try {
    const host = new URL(key.startsWith('http') ? key : `https://${key}`).hostname
      .toLowerCase()
      .replace(/^www\./, '');
    return UNICORN_BY_HOST.has(host);
  } catch {
    return UNICORN_BY_NAME.has(key);
  }
}

/**
 * Returns candidate(s) for a known unicorn by name or host.
 */
export function unicornCandidate(nameOrHost: string): CompanyCandidate | undefined {
  const name = nameOrHost.toLowerCase();
  const direct = UNICORN_BY_NAME.get(name);
  if (direct) {
    const eco = ECOSYSTEMS.find((e) => e.label === 'Unicorn Registry')!;
    return seedToCandidate(eco, {
      name: direct.name,
      website: direct.website,
      country: direct.country,
      city: direct.city,
      stage: 'UNICORN',
      type: 'UNICORN',
      ats: direct.ats,
      confidence: 'HIGH',
    });
  }
  return undefined;
}

/**
 * Ensures all curated unicorns are present in the supplied registry.
 */
export function ensureUnicorns(registry: CompanyRegistry): CompanyRecord[] {
  const eco = ECOSYSTEMS.find((e) => e.label === 'Unicorn Registry')!;
  const records: CompanyRecord[] = [];
  for (const u of UNICORN_REGISTRY) {
    const candidate = seedToCandidate(eco, {
      name: u.name,
      website: u.website,
      country: u.country,
      city: u.city,
      stage: 'UNICORN',
      type: 'UNICORN',
      ats: u.ats,
      confidence: 'HIGH',
    });
    records.push(registry.register(candidate));
  }
  return records;
}

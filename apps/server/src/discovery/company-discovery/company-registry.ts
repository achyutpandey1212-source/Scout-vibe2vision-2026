import { redis } from '../../config/redis';
import { CompanyCandidate, CompanyRecord } from './company.types';
import { normalizeCandidate } from './company-normalizer';
import { seedToCandidate, ECOSYSTEMS } from './ecosystem-config';
import { scoreCompany, computeConfidence, computeCompanyPriority } from './company-score';

/**
 * Canonical Company Registry.
 *
 * Maintains a single identity per company (merged across ecosystems) with
 * canonical name, aliases, website, careers URL, ATS, ecosystem, geo, industry,
 * stage, type and deterministic scoring metrics. Companies change slowly, so
 * resolved records are cached (default 7 days). The registry is self-growing:
 * every discovery run upserts newly found companies, never creating duplicates.
 */

const CACHE_PREFIX = 'company-discovery:registry:';
const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

interface RegistryEntry extends CompanyRecord {
  cachedAt: number;
}

export class CompanyRegistry {
  private store: Map<string, RegistryEntry> = new Map();
  private updatedThisRun = new Set<string>();

  /**
   * Resolves a candidate into a canonical record, merging with any existing
   * entry. Returns the merged, scored record.
   */
  register(candidate: CompanyCandidate): CompanyRecord {
    const { canonicalName, aliases } = normalizeCandidate(candidate);

    const existing = this.store.get(canonicalName);

    const merged: RegistryEntry = existing
      ? this.merge(existing, candidate, aliases, canonicalName)
      : this.create(candidate, aliases, canonicalName);

    this.recomputeMetrics(merged);
    this.store.set(canonicalName, merged);
    return merged;
  }

  /**
   * Self-growing upsert. Normalizes first, merges aliases, and never creates a
   * duplicate. Updates lastSeen, ATS (only if "better"/known), and careers URL
   * (only if official). Stronger (official) data is never overwritten by weaker
   * data. Returns whether the record was newly created.
   */
  upsert(
    candidate: CompanyCandidate,
    opts: { mission?: string; strategy?: string } = {},
  ): { record: CompanyRecord; isNew: boolean } {
    const { canonicalName, aliases } = normalizeCandidate(candidate);
    const existing = this.store.get(canonicalName);
    const isNew = !existing;

    const merged: RegistryEntry = existing
      ? this.merge(existing, candidate, aliases, canonicalName)
      : this.create(candidate, aliases, canonicalName);

    merged.lastSeen = Date.now();
    if (opts.mission) merged.discoveredByMission = opts.mission;
    if (opts.strategy) merged.discoveredByStrategy = opts.strategy;

    this.recomputeMetrics(merged);
    this.store.set(canonicalName, merged);
    this.updatedThisRun.add(canonicalName);
    return { record: merged, isNew };
  }

  /** Number of registry entries modified during the current run. */
  updatesThisRun(): number {
    return this.updatedThisRun.size;
  }

  clearRunTracking(): void {
    this.updatedThisRun.clear();
  }

  private recomputeMetrics(entry: RegistryEntry): void {
    const metrics = scoreCompanyWithConfidence(entry);
    entry.companyScore = metrics.companyScore;
    entry.companyConfidence = metrics.companyConfidence;
    entry.companyPriority = metrics.companyPriority;
  }

  private create(
    candidate: CompanyCandidate,
    aliases: string[],
    canonicalName: string,
  ): RegistryEntry {
    const entry: RegistryEntry = {
      canonicalName,
      aliases,
      website: candidate.website,
      careersUrl: candidate.careersUrl,
      ats: candidate.ats && candidate.ats !== 'UNKNOWN' ? candidate.ats : 'UNKNOWN',
      ecosystem: candidate.ecosystem,
      country: candidate.country,
      city: candidate.city,
      stage: candidate.companyStage,
      type: candidate.companyType,
      priority: 0,
      source: candidate.source,
      ecosystemLabel: candidate.ecosystemLabel,
      confidence: candidate.confidence,
      companyScore: 0,
      companyConfidence: 0,
      companyPriority: 0,
      atsVerified: false,
      careerPageVerified: false,
      lastSeen: Date.now(),
      cachedAt: Date.now(),
    };
    return entry;
  }

  private merge(
    existing: RegistryEntry,
    candidate: CompanyCandidate,
    aliases: string[],
    canonicalName: string,
  ): RegistryEntry {
    const aliasSet = new Set([...existing.aliases, ...aliases]);

    // Prefer the strongest signal: careersUrl, ats, stage, type from either side.
    const careersUrl = existing.careersUrl || candidate.careersUrl;
    const stage = candidate.companyStage || existing.stage;
    const type = candidate.companyType || existing.type;
    const city = existing.city || candidate.city;
    const website =
      candidate.website && candidate.website.length > existing.website.length
        ? candidate.website
        : existing.website;

    // Higher ecosystem strength wins for ecosystem fields.
    const strongerEco =
      ecosystemStrength(candidate.ecosystem) >= ecosystemStrength(existing.ecosystem)
        ? candidate.ecosystem
        : existing.ecosystem;

    // ATS: known (non-UNKNOWN) wins; never downgrade a known ATS to UNKNOWN.
    const ats = candidate.ats && candidate.ats !== 'UNKNOWN' ? candidate.ats : existing.ats;

    // Carry forward verification flags — never lose a positive verification.
    const atsVerified = existing.atsVerified || false;
    const careerPageVerified = existing.careerPageVerified || false;

    return {
      ...existing,
      aliases: Array.from(aliasSet),
      canonicalName,
      website,
      careersUrl,
      ats,
      stage,
      type,
      city: city || existing.city,
      ecosystem: strongerEco,
      ecosystemLabel: candidate.ecosystemLabel || existing.ecosystemLabel,
      confidence: candidate.confidence === 'HIGH' ? 'HIGH' : existing.confidence,
      atsVerified,
      careerPageVerified,
      cachedAt: Date.now(),
    };
  }

  get(canonicalName: string): CompanyRecord | undefined {
    return this.store.get(canonicalName);
  }

  getByWebsite(website: string): CompanyRecord | undefined {
    const host = website
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
    for (const entry of this.store.values()) {
      const entryHost = entry.website
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0];
      if (entryHost === host) return entry;
    }
    return undefined;
  }

  all(): CompanyRecord[] {
    return Array.from(this.store.values()).map(stripCachedAt);
  }

  size(): number {
    return this.store.size;
  }

  /**
   * Seeds the registry from the curated ecosystem configuration. Deterministic.
   */
  seedFromEcosystems(): CompanyRecord[] {
    const records: CompanyRecord[] = [];
    for (const eco of ECOSYSTEMS) {
      for (const company of eco.companies) {
        const candidate = seedToCandidate(eco, company);
        records.push(this.register(candidate));
      }
    }
    return records;
  }

  // ─── Caching ─────────────────────────────────────────────────────────────

  async loadFromCache(): Promise<number> {
    const client = redisClient();
    if (!client) return 0;
    let loaded = 0;
    for (const eco of ECOSYSTEMS) {
      for (const company of eco.companies) {
        const key = CACHE_PREFIX + normalizeKey(company.name);
        try {
          const raw = await client.get(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw) as RegistryEntry;
          this.store.set(parsed.canonicalName, parsed);
          loaded++;
        } catch {
          // ignore cache read errors
        }
      }
    }
    return loaded;
  }

  async persistToCache(): Promise<void> {
    const client = redisClient();
    if (!client) return;
    for (const entry of this.store.values()) {
      const key = CACHE_PREFIX + normalizeKey(entry.canonicalName);
      try {
        await client.setex(key, CACHE_TTL_SECONDS, JSON.stringify(entry));
      } catch {
        // ignore cache write errors
      }
    }
  }
}

/**
 * Computes the deterministic scoring triple (score, confidence, priority) for a
 * record without mutating it. Used by the registry recompute path.
 */
export function scoreCompanyWithConfidence(record: CompanyRecord): {
  companyScore: number;
  companyConfidence: number;
  companyPriority: number;
} {
  const companyScore = scoreCompany(record);
  const companyConfidence = computeConfidence(record);
  const companyPriority = computeCompanyPriority(companyScore, companyConfidence);
  return { companyScore, companyConfidence, companyPriority };
}

function ecosystemStrength(eco: string): number {
  switch (eco) {
    case 'UNICORN':
    case 'STARTUP_ACCELERATOR':
      return 3;
    case 'AI_COMPANY':
    case 'DEVELOPER_COMPANY':
      return 2;
    default:
      return 1;
  }
}

function stripCachedAt(entry: RegistryEntry): CompanyRecord {
  const { cachedAt, ...rest } = entry;
  void cachedAt;
  return rest;
}

function normalizeKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function redisClient(): ReturnType<typeof redis.getClient> | null {
  try {
    return redis.getClient();
  } catch {
    return null;
  }
}

export const companyRegistry = new CompanyRegistry();

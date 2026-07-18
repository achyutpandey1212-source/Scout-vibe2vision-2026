import { CompanyCandidate } from './company.types';

/**
 * Deterministic company normalization.
 *
 * Merges aliases (e.g. "Google LLC", "Google Inc" -> "Google") into a single
 * canonical identity. No LLM, no fuzzy matching — exact alias tables plus
 * deterministic suffix stripping.
 */

export interface NormalizedIdentity {
  canonicalName: string;
  aliases: string[];
}

/**
 * Curated alias groups. The first entry is the canonical name.
 */
const ALIAS_GROUPS: string[][] = [
  ['Google', 'Google LLC', 'Google Inc', 'Google India', 'Alphabet', 'Google Research'],
  ['Meta', 'Meta Platforms', 'Meta Platforms Inc', 'Facebook', 'Facebook Inc'],
  ['Microsoft', 'Microsoft Corporation', 'Microsoft India', 'Microsoft Research'],
  ['Apple', 'Apple Inc', 'Apple India'],
  ['Amazon', 'Amazon.com', 'Amazon Web Services', 'AWS', 'Amazon Development Centre'],
  ['OpenAI', 'OpenAI Inc', 'OpenAI GP', 'OpenAI OpCo'],
  ['Anthropic', 'Anthropic PBC', 'Anthropic AI'],
  ['Cursor', 'Anysphere', 'Cursor AI'],
  ['Stripe', 'Stripe Inc', 'Stripe Payments'],
  ['GitHub', 'GitHub Inc', 'Github'],
  ['Y Combinator', 'YCombinator', 'YC'],
  ['T-Hub', 'T Hub', 'THub'],
  ['Razorpay', 'Razorpay Software Private Limited'],
  ['Freshworks', 'FreshWorks Inc', 'Freshdesk'],
  ['Postman', 'Postman Inc'],
  ['PhonePe', 'PhonePe Private Limited'],
  ['ShareChat', 'Mohalla Tech'],
  ['OfBusiness', 'OfBusiness Ltd'],
  ['Perplexity', 'Perplexity AI'],
  ['HuggingFace', 'Hugging Face'],
  ['Weights & Biases', 'WandB', 'W&B'],
  ['Mistral', 'Mistral AI'],
  ['Scale AI', 'Scale'],
  ['Cloudflare', 'CloudFlare'],
  ['MongoDB', 'Mongo DB'],
  ['Databricks', 'DataBricks'],
  ['Snowflake', 'SnowFlake'],
  ['Hashicorp', 'HashiCorp', 'HashiCorp Inc'],
  ['Vercel', 'Vercel Inc'],
  ['Netlify', 'Netlify Inc'],
  ['Supabase', 'Supabase Inc'],
];

/** Suffixes stripped when building a normalization key. */
const NAME_SUFFIXES = [
  'inc',
  'inc.',
  'llc',
  'ltd',
  'ltd.',
  'limited',
  'pvt',
  'pvt.',
  'private limited',
  'plc',
  'corp',
  'corp.',
  'corporation',
  'co',
  'co.',
  'company',
  'gmbh',
  'sa',
  'sas',
  'ag',
  'pbc',
  'opco',
  'technologies',
  'technology',
  'software',
  'software pvt ltd',
  'india',
  'india pvt ltd',
  'global',
  'pvt ltd',
  'private limited',
  'software pvt ltd',
  'software private limited',
];

/**
 * Normalizes a company name into a stable key for comparison.
 * Lowercases, strips punctuation, removes legal suffixes, collapses whitespace.
 */
export function normalizeAliasKey(name: string): string {
  let key = name.toLowerCase().replace(/[.,&]/g, ' ').replace(/\s+/g, ' ').trim();

  // Strip known multi-word suffix phrases first.
  for (const phrase of NAME_SUFFIXES.filter((s) => s.includes(' '))) {
    const suffix = ' ' + phrase;
    if (key.endsWith(suffix)) {
      key = key.slice(0, -suffix.length).trim();
    }
  }

  let prev = '';
  // Repeatedly strip trailing single-word suffixes until stable.
  while (prev !== key) {
    prev = key;
    const tokens = key.split(' ');
    while (tokens.length > 1 && NAME_SUFFIXES.includes(tokens[tokens.length - 1])) {
      tokens.pop();
    }
    key = tokens.join(' ').trim();
  }

  return key;
}

const ALIAS_TO_CANONICAL = new Map<string, string>();
const CANONICAL_TO_ALIASES = new Map<string, Set<string>>();

for (const group of ALIAS_GROUPS) {
  const canonical = group[0];
  const aliases = new Set<string>();
  for (const alias of group) {
    ALIAS_TO_CANONICAL.set(normalizeAliasKey(alias), canonical);
    aliases.add(alias);
  }
  CANONICAL_TO_ALIASES.set(canonical, aliases);
}

/**
 * Resolves the canonical name for a given candidate. Returns the original name
 * when no alias group matches (still canonical by definition).
 */
export function resolveCanonicalName(name: string): string {
  const canonical = ALIAS_TO_CANONICAL.get(normalizeAliasKey(name));
  return canonical || name.trim();
}

/**
 * Collects the full alias set known for a canonical name.
 */
export function getAliases(canonicalName: string): string[] {
  const aliases = CANONICAL_TO_ALIASES.get(canonicalName);
  if (!aliases) return [canonicalName];
  return Array.from(aliases);
}

/**
 * Deterministic equality check between two company names.
 */
export function isSameCompany(a: string, b: string): boolean {
  return resolveCanonicalName(a) === resolveCanonicalName(b);
}

/**
 * Normalizes a CompanyCandidate in place, returning its canonical name.
 * Used by the registry to merge duplicates across ecosystems.
 */
export function normalizeCandidate(candidate: CompanyCandidate): {
  canonicalName: string;
  aliases: string[];
} {
  const canonicalName = resolveCanonicalName(candidate.name);
  const aliases = getAliases(canonicalName);
  if (!aliases.includes(candidate.name)) {
    aliases.push(candidate.name);
  }
  return { canonicalName, aliases: Array.from(new Set(aliases)) };
}

import { Ecosystem, EcosystemScore, EngineeringFocus } from './ecosystem.types';

/**
 * Deterministic ecosystem scoring.
 *
 * No randomness, no LLM. Each factor is a fixed weight contributing to a 0-100
 * composite score. Adding a new ecosystem never requires touching these
 * weights — only the ecosystem's curated metadata drives the score.
 */

const WEIGHTS = {
  officialPresence: 12, // has officialWebsite + portfolioPage
  directoryAvailable: 8, // has startupDirectory
  portfolioAvailable: 10, // has portfolioPage / companiesPage
  startupCount: 18, // number of known domains
  engineeringRelevance: 22, // engineering focus alignment
  internshipYield: 16, // historical internship likelihood
  atsUsage: 6, // known ATS boards
  hiringHistory: 6, // known career pages
  startupQuality: 4, // priority band
  indiaRelevance: 8, // India region boost for the target audience
} as const;

/** Focus areas that strongly map to engineering internships. */
const ENGINEERING_FOCUS: ReadonlySet<EngineeringFocus> = new Set<EngineeringFocus>([
  'AI',
  'DEEPTECH',
  'CLOUD',
  'CYBERSECURITY',
  'DEVELOPER_TOOLS',
  'RESEARCH',
  'OPEN_SOURCE',
]);

const MAX_DOMAINS_FOR_SCORE = 25;

/**
 * Scores a single ecosystem deterministically.
 */
export function scoreEcosystem(eco: Ecosystem): EcosystemScore {
  let score = 0;

  if (eco.officialWebsite && eco.portfolioPage) score += WEIGHTS.officialPresence;
  if (eco.startupDirectory) score += WEIGHTS.directoryAvailable;
  if (eco.portfolioPage || eco.companiesPage) score += WEIGHTS.portfolioAvailable;

  const domainFactor =
    Math.min(eco.knownDomains.length, MAX_DOMAINS_FOR_SCORE) / MAX_DOMAINS_FOR_SCORE;
  score += WEIGHTS.startupCount * domainFactor;

  const engFocus = eco.engineeringFocus.filter((f) => ENGINEERING_FOCUS.has(f)).length;
  const engFactor = eco.engineeringFocus.length ? engFocus / eco.engineeringFocus.length : 0;
  score += WEIGHTS.engineeringRelevance * engFactor;

  score += WEIGHTS.internshipYield * eco.internshipLikelihood;

  if (eco.knownATS.length > 0) score += WEIGHTS.atsUsage;

  const careerFactor = Math.min(eco.knownCareerPages.length, 5) / 5;
  score += WEIGHTS.hiringHistory * careerFactor;

  score += WEIGHTS.startupQuality * ((4 - eco.priority) / 3);

  if (eco.region === 'INDIA') score += WEIGHTS.indiaRelevance;

  score = Math.round(Math.min(100, Math.max(0, score)));

  const expectedOpportunityYield =
    eco.knownDomains.length * 2 +
    eco.knownCareerPages.length +
    Math.round(eco.internshipLikelihood * eco.knownDomains.length * 3);

  const expectedEngineeringRelevance = eco.engineeringFocus.length
    ? eco.engineeringFocus.filter((f) => ENGINEERING_FOCUS.has(f)).length /
      eco.engineeringFocus.length
    : 0;

  return {
    ecosystemId: eco.id,
    ecosystemName: eco.name,
    ecosystemScore: score,
    ecosystemPriority: eco.priority,
    expectedOpportunityYield,
    expectedEngineeringRelevance: Number(expectedEngineeringRelevance.toFixed(2)),
  };
}

/**
 * Scores every ecosystem.
 */
export function scoreAllEcosystems(ecosystems: Ecosystem[]): EcosystemScore[] {
  return ecosystems.map(scoreEcosystem).sort((a, b) => b.ecosystemScore - a.ecosystemScore);
}

/**
 * Returns ecosystems whose region / focus match a mission routing filter.
 * Used by the Query Planner to prioritize, e.g., "Global AI ecosystems with
 * high remote friendliness" — all deterministic, no AI calls.
 */
export function filterEcosystemsForMission(
  ecosystems: Ecosystem[],
  opts: {
    region?: Ecosystem['region'];
    focus?: EngineeringFocus;
    minInternshipLikelihood?: number;
    minRemoteFriendliness?: number;
  },
): Ecosystem[] {
  return ecosystems.filter((eco) => {
    if (opts.region && eco.region !== opts.region) return false;
    if (opts.focus && !eco.engineeringFocus.includes(opts.focus)) return false;
    if (
      opts.minInternshipLikelihood !== undefined &&
      eco.internshipLikelihood < opts.minInternshipLikelihood
    ) {
      return false;
    }
    if (
      opts.minRemoteFriendliness !== undefined &&
      eco.remoteFriendliness < opts.minRemoteFriendliness
    ) {
      return false;
    }
    return true;
  });
}

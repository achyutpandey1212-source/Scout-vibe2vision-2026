import { ATSProvider, DiscoveryResult, Ecosystem } from './ecosystem.types';
import { deriveCareersUrl, normalizeHost } from './ecosystem-registry';

/**
 * Plug-in interface for a deterministic ecosystem discovery strategy.
 *
 * Each strategy inspects a single ecosystem's curated metadata and emits a
 * {@link DiscoveryResult}. No network access is required or permitted for
 * deterministic discovery.
 */
export interface EcosystemDiscoveryStrategy {
  /** Strategy name, e.g. "portfolio". */
  readonly name: string;

  /**
   * Whether this strategy applies to the given ecosystem.
   */
  supports(eco: Ecosystem): boolean;

  /**
   * Run the strategy against one ecosystem.
   */
  discover(eco: Ecosystem): DiscoveryResult;
}

/**
 * Shared helper: builds an empty result skeleton for an ecosystem.
 */
export function emptyResult(eco: Ecosystem): DiscoveryResult {
  return {
    ecosystemId: eco.id,
    companies: [],
    portfolioPages: [],
    directories: [],
    incubators: [],
    startupListings: [],
    programPages: [],
    careerPages: [],
    atsPages: [],
    candidateUrls: [],
  };
}

/**
 * Shared helper: derive a deterministic company artifact from a known domain.
 */
export function companyFromDomain(
  eco: Ecosystem,
  domain: string,
  ats?: ATSProvider,
): DiscoveryResult['companies'][number] {
  const website = `https://${domain}`;
  return {
    name: domain.split('.')[0].replace(/(^|-)(\w)/g, (_m, _s, c) => c.toUpperCase()),
    website,
    ecosystemId: eco.id,
    ecosystemName: eco.name,
    type: eco.type,
    country: eco.country,
    ats,
  };
}

export { deriveCareersUrl, normalizeHost };

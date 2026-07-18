/**
 * Ecosystem Intelligence Engine — public surface.
 *
 * Deterministic, LLM-free. Maps ecosystems into high-quality crawl candidates
 * that feed Company Discovery and the Search Orchestrator.
 */
export type * from './ecosystem.types';
export {
  ECOSYSTEMS,
  CITIES,
  getEcosystem,
  allEcosystems,
  getCity,
  allCities,
  normalizeHost,
  deriveCareersUrl,
  atsHostFor,
} from './ecosystem-registry';
export type { EcosystemDiscoveryStrategy } from './strategy.types';
export { emptyResult, companyFromDomain } from './strategy.types';
export { PortfolioDiscovery } from './portfolio-discovery';
export { IncubatorDiscovery } from './incubator-discovery';
export { AcceleratorDiscovery } from './accelerator-discovery';
export { UniversityDiscovery } from './university-discovery';
export { CityDiscovery } from './city-discovery';
export { EcosystemDiscovery } from './ecosystem-discovery';
export { scoreEcosystem, scoreAllEcosystems, filterEcosystemsForMission } from './ecosystem-score';
export { EcosystemEngine } from './ecosystem-engine';
export { EcosystemHealthReport } from './ecosystem-health';
export {
  buildTestReport,
  formatTestReport,
  saveReports,
  main as ecosystemCliMain,
  KNOWN_TEST_IDS,
} from './ecosystem-cli';
export { ecosystemEngine } from './ecosystem-engine.instance';

import { EcosystemEngine } from './ecosystem-engine';

/**
 * Shared singleton instance of the Ecosystem Intelligence Engine.
 *
 * Used by Company Discovery / Search Orchestrator integration so the rest of
 * Discovery can consume deterministic ecosystem crawl candidates without
 * creating its own engine.
 */
export const ecosystemEngine = new EcosystemEngine();

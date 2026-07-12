import { IPipelineStage } from './pipeline-stage.interface';
import { DiscoveryContext } from '../types/query.types';
import { generateSearchQueries } from '../query-planner/query-planner';
import { searchOpportunities } from '../search/search-orchestrator';

export interface CandidateURL {
  url: string;
  source: string;
  query: string;
  snippet: string;
  score: number;
  discoveredAt: string;
}

export class Stage1Discovery implements IPipelineStage<DiscoveryContext, CandidateURL[]> {
  /**
   * Executes Stage 1: Massive Opportunity Discovery
   * Finds candidate URLs matching context parameters and returns validated URLs.
   */
  async execute(
    context: DiscoveryContext,
    options?: { skipSearch?: boolean },
  ): Promise<CandidateURL[]> {
    console.log('[Stage 1] Initializing opportunity discovery...');

    // 1. Generate search queries dynamically using the query planner
    console.log('[Stage 1] Generating SEO optimized query list...');
    const plannerResponse = await generateSearchQueries(context);

    // 2. Query search sources to gather candidates
    console.log(`[Stage 1] Executing searches for ${plannerResponse.queries.length} queries...`);
    const searchResponse = await searchOpportunities(plannerResponse);

    // 3. Extract and map accepted candidate URLs
    const candidates: CandidateURL[] = searchResponse.accepted.map((item) => ({
      url: item.url,
      source: item.source || 'Tavily Search',
      query: item.queryUsed,
      snippet: item.snippet,
      score: item.score,
      discoveredAt: item.retrievedAt || new Date().toISOString(),
    }));

    console.log(
      `[Stage 1] Completed. Discovered and validated ${candidates.length} candidate URLs.`,
    );
    return candidates;
  }
}

import { DiscoveryContext, QueryPlannerResponse } from '../types/query.types';
import { DetailedQueryPlannerOutputSchema } from '../schemas/query.schema';
import { generateStructuredResponse } from '../../ai/capabilities/structured-output';

const DEFAULT_MAX_QUERIES = 25;

/**
 * Generates highly diversified, search-engine-friendly search queries
 * for discovering opportunities based on target audience, country, and categories.
 */
export async function generateSearchQueries(
  context: DiscoveryContext,
): Promise<QueryPlannerResponse> {
  const maxQueries = Math.min(context.maxQueries ?? DEFAULT_MAX_QUERIES, DEFAULT_MAX_QUERIES);

  const systemInstruction = `You are a professional Opportunity Intelligence Researcher for Scout.
Scout's mission is to discover life-changing opportunities for EVERY woman (e.g., school students, graduates, B.Tech, Arts, BCA, MBA, homemakers restarting careers, rural women, entrepreneurs, skilled trades like tailoring/beauticians).

Your goal is to output a set of search queries optimized for search engines to discover these opportunities.

CRITICAL INSTRUCTIONS:
1. MAX BUDGET: Generate at most ${maxQueries} queries. Quality and diversity are preferred over quantity.
2. DIVERSITY: Distribute the queries across different opportunity clusters:
   - Jobs, Internships, Apprenticeships, Returnships
   - Scholarships, Fellowships, Grants, Competitions
   - Skill Development, Vocational Training (tailoring, baking, beautician, machine operator, etc.)
   - Government Schemes (e.g., Skill India, PMKVY, MSME schemes, State schemes)
   - NGO Programs, CSR Initiatives
   - Remote Work, Freelancing, Self Employment, Women Entrepreneurship
   - Local Employment, International Opportunities
3. SEARCH-ENGINE OPTIMIZED (SEO) KEYWORD PHRASES: Queries MUST be formulated for search engines.
   - DO NOT write natural language sentences or conversational questions.
   - DO NOT use filler words like "for", "in", "of", "to", "the", "a" unless part of a proper noun (e.g., use "women scholarship india 2026" instead of "scholarships for women in india").
   - Prefer space-separated keyword lists.
   - Good examples:
     "women scholarship india 2026"
     "tailoring training women government scheme"
     "remote customer support jobs women india"
     "ngo women entrepreneurship grants"
     "beautician training free government program"
     "csr skill development women"
     "women work from home opportunities india"
     "anganwadi recruitment women"
     "assistant teacher recruitment women"
   - Bad examples:
     "scholarships for women in india"
     "What are some government schemes for tailoring training?"
     "How to apply for anganwadi jobs"
4. STRUCTURAL OUTPUT: You must provide a JSON response containing detailed planned queries, matching the requested schema. Ensure fields are accurately populated to support future-proof features.`;

  const prompt = `Generate a set of search-engine optimized queries to discover opportunities for:
Target Audience: ${context.targetAudience}
Country: ${context.country}
Target Categories requested: ${context.categories.join(', ')}

Strict constraint: Return a JSON object with a "queries" array. Each query must have the structure:
- "query": The search query string optimized for search engines.
- "priority": "high", "medium", or "low".
- "category": The specific category/cluster it represents.
- "tags": Array of keyword tags.
- "expectedOpportunityType": Description of the type of opportunity this query is targeting.

Ensure max queries count does not exceed ${maxQueries}. Make every query unique.`;

  try {
    const rawResult = await generateStructuredResponse({
      prompt,
      schema: DetailedQueryPlannerOutputSchema,
      context: 'discovery',
      systemInstruction,
      temperature: 0.2, // Balanced temperature for creativity + structure
    });

    // Post-process, normalize, and deduplicate
    const uniqueQueriesSet = new Set<string>();

    for (const item of rawResult.queries) {
      const normalizedQuery = item.query.trim().replace(/\s+/g, ' ');
      if (normalizedQuery.length > 0) {
        uniqueQueriesSet.add(normalizedQuery);
      }
    }

    // Convert Set back to Array and enforce the query budget limit
    const finalQueries = Array.from(uniqueQueriesSet).slice(0, maxQueries);

    return {
      queries: finalQueries,
    };
  } catch (error: any) {
    console.error('[Discovery Query Planner] Failed to generate search queries:', error.message);
    throw error;
  }
}

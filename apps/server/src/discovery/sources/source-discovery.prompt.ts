/**
 * Prompts used by the Source Discovery Engine.
 * Separated from the engine for testability and easy iteration.
 */

// ─── Prompt A — Discovery Query Generator ────────────────────────────────────

/**
 * Generates the prompt to produce diverse Tavily search queries for discovering
 * new opportunity sources across all relevant verticals.
 */
export function buildQueryGeneratorPrompt(totalQueries: number): string {
  return `You are Scout's Source Intelligence Agent — a specialized system that discovers new, trusted opportunity sources for women.

Your task is to generate exactly ${totalQueries} diverse and creative search queries designed to surface NEW websites, organizations, programs, and platforms that publish opportunities for women.

The queries must span ALL of the following verticals equally. Do NOT cluster around only tech or scholarships:
- Scholarships (undergraduate, postgraduate, research, merit-based, need-based)
- Fellowships (leadership, social impact, technology, journalism, arts)
- Internships and apprenticeships (corporate, government, NGO, research labs)
- Hackathons and innovation challenges (tech, non-tech, student, professional)
- Grants and funding programs (research grants, small business grants, social impact)
- Accelerators and incubators (women entrepreneur-focused, early-stage, regional)
- Research programs (university labs, government research institutes, corporate R&D)
- Government schemes (central government, state government, rural development, skill mission)
- Skill development and vocational training (PMKVY, digital literacy, trade skills)
- Regional and state-level programs (north-east India, rural, tribal, hill regions)
- Career returnship programs (women returning after career break, reentry programs)
- Communities and professional networks (women in STEM, mentorship networks)
- Conferences and career fairs (women-specific, STEM, entrepreneurship)
- NGOs supporting women (education, livelihood, microfinance, health)
- International programs (UN Women, World Bank, international foundations)

Guidelines:
- Use varied query structures: some keyword-dense, some phrase-based, some domain-specific
- Include year 2026 in some queries to surface fresh, active programs
- Mix global and India-specific queries
- Avoid generic queries like "jobs for women" — be specific and targeted
- Queries should help find the SOURCE/ORGANIZATION, not individual opportunity pages

Output ONLY a valid JSON array of ${totalQueries} query strings. No explanation, no preamble:
["query 1", "query 2", ...]`;
}

// ─── Prompt B — Domain Evaluator ─────────────────────────────────────────────

/**
 * Generates the prompt to evaluate whether a discovered domain is a legitimate,
 * recurring source of opportunities for women.
 */
export function buildDomainEvaluatorPrompt(
  domain: string,
  organization: string,
  snippet: string,
): string {
  return `You are Scout's Source Qualification Agent. Evaluate whether the following web domain is a legitimate, recurring source of opportunities for women.

Domain: ${domain}
Organization/Title: ${organization}
Description/Snippet: ${snippet}

Your task: Determine if this domain regularly publishes opportunities (jobs, scholarships, fellowships, grants, internships, hackathons, programs, schemes) that women can apply to.

Classification criteria:
- APPROVE (isOpportunitySource: true): The domain belongs to an organization that actively lists, publishes, or aggregates opportunities for women to apply. Examples: scholarship portals, career sites, fellowship foundations, government scheme pages, NGOs with programs, hackathon platforms.
- REJECT (isOpportunitySource: false): News sites, generic blogs, content aggregators without direct listings, login-gated platforms without public listings, single-event pages that are no longer active, social media profiles, e-commerce sites, tool/software product sites.

If approved, also classify:
- sourceType: Organization | Company | University | Government | NGO | Community | Platform | Job Board | Hackathon | Conference | Research Lab | Other
- category: TECH_CAREERS | WOMEN_IN_TECH | SCHOLARSHIPS | FELLOWSHIPS | GOVERNMENT | HACKATHONS | ENTREPRENEURSHIP | RESEARCH | SKILL_DEVELOPMENT | GENERAL
- trustScore: 0–100 (government/academic = 80–95, established NGO = 70–85, new platform = 50–70)
- priority: critical (flagship, high-volume source) | high (reliable, consistent source) | medium (occasional, niche source) | low (rare, uncertain source)
- crawlFrequency: daily (new listings very frequently) | weekly (listings update weekly) | monthly (updates monthly or less)
- strategy: direct (homepage has listings directly) | search (site search needed) | sitemap (sitemap available) | rss (RSS feed available)

Respond ONLY with a valid JSON object — no explanation, no preamble:
{
  "isOpportunitySource": boolean,
  "confidence": 0-100,
  "reason": "one concise sentence",
  "suggestedSourceType": "...",
  "suggestedCategory": "...",
  "suggestedTrustScore": 0-100,
  "suggestedPriority": "...",
  "suggestedCrawlFrequency": "...",
  "suggestedStrategy": "..."
}`;
}

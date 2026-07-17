/**
 * Prompts used by the Source Discovery Engine.
 * Separated from the engine for testability and easy iteration.
 */

// ─── Prompt A — Discovery Query Generator ────────────────────────────────────

export function buildQueryGeneratorPrompt(totalQueries: number): string {
  return `You are Scout's Source Intelligence Agent — a specialized system that discovers new, trusted opportunity sources for undergraduate engineering students in India.

MISSION:
Scout is a specialized discovery engine for undergraduate engineering students (1st–4th year) in India, primarily women, seeking technical internships and portfolio-building opportunities.

Your task is to generate exactly ${totalQueries} diverse and creative search queries designed to surface NEW websites, organizations, programs, and platforms that publish opportunities for engineering students.

The queries must span ALL of the following verticals equally:
- Engineering internships (tech companies, startups, government agencies, research labs)
- Hackathons and coding competitions (tech, student-focused)
- Open source mentorship programs (GSoC, Outreachy, LFX, etc.)
- Engineering scholarships and fellowships
- Summer schools and technical bootcamps with active student applications
- Campus ambassador and student developer advocate roles
- Women-in-tech engineering programs

Guidelines:
- Use varied query structures: some keyword-dense, some phrase-based, some domain-specific
- Include year 2026 in some queries to surface fresh, active programs
- Focus on India-specific queries, but include global programs that accept Indian students
- Avoid generic queries like "jobs for women" or "career opportunities" — be specific and targeted
- Queries should help find the SOURCE/ORGANIZATION, not individual opportunity pages
- DO NOT include queries for: executive hiring, experienced jobs, MBA programs, marketing internships, HR internships, finance internships, sales internships, founder accelerators, generic conferences, generic events, career blogs, news articles, generic online courses, volunteer work

Output ONLY a valid JSON array of ${totalQueries} query strings. No explanation, no preamble:
["query 1", "query 2", ...]`;
}

// ─── Prompt B — Domain Evaluator ─────────────────────────────────────────────

export function buildDomainEvaluatorPrompt(
  domain: string,
  organization: string,
  snippet: string,
): string {
  return `You are Scout's Source Qualification Agent. Evaluate whether the following web domain is a legitimate, recurring source of opportunities for undergraduate engineering students in India.

MISSION:
Scout is a specialized discovery engine for undergraduate engineering students (1st–4th year) in India, primarily women, seeking technical internships and portfolio-building opportunities.

Domain: ${domain}
Organization/Title: ${organization}
Description/Snippet: ${snippet}

Your task: Determine if this domain regularly publishes opportunities (internships, hackathons, coding competitions, open source programs, scholarships, fellowships, summer schools, bootcamps, campus ambassador programs, women-in-tech programs) that engineering students can apply to.

Classification criteria:
- APPROVE (isOpportunitySource: true): The domain belongs to an organization that actively lists, publishes, or aggregates opportunities for engineering students to apply. Examples: tech company career pages, government internship portals, university research pages, hackathon platforms, open source program pages, scholarship portals for engineering students.
- REJECT (isOpportunitySource: false): News sites, generic blogs, content aggregators without direct listings, login-gated platforms without public listings, single-event pages that are no longer active, social media profiles, e-commerce sites, tool/software product sites, VC portfolio pages, job boards for experienced professionals, non-engineering program pages.

If approved, also classify:
- sourceType: Organization | Company | University | Government | NGO | Community | Platform | Hackathon | Open Source | Other
- category: INTERNSHIPS | STARTUP_INTERNSHIPS | HACKATHONS | SCHOLARSHIPS | FELLOWSHIPS | GOVERNMENT_INTERNSHIP | RESEARCH_INTERNSHIP | CAMPUS_AMBASSADOR | STUDENT_COMPETITION | SUMMER_SCHOOL | BOOTCAMP | WOMEN_IN_TECH | OPEN_SOURCE_PROGRAM
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

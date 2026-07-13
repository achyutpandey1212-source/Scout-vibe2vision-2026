import { DiscoveryContext, QueryPlannerResponse } from '../types/query.types';

// Deterministic query banks mapped to target categories and country-level tags.
// Formulated strictly for SEO space-separated keyword searches.
const DETERMINISTIC_QUERIES: Record<string, string[]> = {
  Careers: [
    'women internship recruitment 2026',
    'female fresher entry level jobs 2026',
    'women career returnship program return break',
    'remote customer service support jobs women work from home',
    'apprenticeship program women industry 2026',
    'part time work from home women assistant typing',
    'campus recruitment hiring drive women engineers graduates',
  ],
  Scholarships: [
    'women engineering scholarship 2026',
    'female mba scholarships management degree',
    'women commerce arts college scholarship',
    'nursing medical college scholarship female student',
    'postgraduate phd research fellowship women',
    'bca bsc computer applications scholarship girls',
  ],
  Government: [
    'government scheme women training skill development 2026',
    'pmkvy skill india training centers women registry',
    'national rural livelihood mission nrlm women self help group',
    'anganwadi helper worker recruitment vacancy 2026',
    'government teacher recruitment primary secondary female reservation',
  ],
  SkillDevelopment: [
    'free tailoring sewing training program women government NGO',
    'beautician makeup artist training course free registration women',
    'digital marketing computer literacy training women course NGO',
    'english speaking communication skill development course women training',
    'retail hospitality machine operator training women program PMKVY',
  ],
  Entrepreneurship: [
    'mudra loan women entrepreneur application startup scheme',
    'stand up india scheme loan women SC ST entrepreneur registry',
    'women startup incubator grant funding msme india',
    'mahila e haat product listing women self help group registry',
  ],
  Competitions: [
    'women hackathon coding innovation challenge 2026',
    'female entrepreneur pitch competition startup grant awards',
    'women fellowship leadership program community impact awards',
  ],
};

/**
 * Generates deterministic search queries to guarantee category distribution
 * and prevent AI drift.
 */
export async function generateSearchQueries(
  context: DiscoveryContext,
): Promise<QueryPlannerResponse> {
  const targetCountry = context.country || 'India';
  const queries: string[] = [];

  // Categorized template iterations to construct queries matching exact target percentages.
  // 1. Careers (7 queries)
  const careerTemplates = DETERMINISTIC_QUERIES.Careers.slice(0, 7);
  careerTemplates.forEach((q) => queries.push(`${q} ${targetCountry}`.toLowerCase()));

  // 2. Scholarships (5 queries)
  const scholarshipTemplates = DETERMINISTIC_QUERIES.Scholarships.slice(0, 6);
  scholarshipTemplates.forEach((q) => queries.push(`${q} ${targetCountry}`.toLowerCase()));

  // 3. Government Schemes (4 queries)
  const govtTemplates = DETERMINISTIC_QUERIES.Government.slice(0, 5);
  govtTemplates.forEach((q) => queries.push(`${q} ${targetCountry}`.toLowerCase()));

  // 4. Skill Development (4 queries)
  const skillTemplates = DETERMINISTIC_QUERIES.SkillDevelopment.slice(0, 5);
  skillTemplates.forEach((q) => queries.push(`${q} ${targetCountry}`.toLowerCase()));

  // 5. Entrepreneurship (3 queries)
  const entrepreneurTemplates = DETERMINISTIC_QUERIES.Entrepreneurship.slice(0, 4);
  entrepreneurTemplates.forEach((q) => queries.push(`${q} ${targetCountry}`.toLowerCase()));

  // 6. Competitions (2 queries)
  const compTemplates = DETERMINISTIC_QUERIES.Competitions.slice(0, 3);
  compTemplates.forEach((q) => queries.push(`${q} ${targetCountry}`.toLowerCase()));

  // Deduplicate and slice to context limits or default budget limit
  const limit = context.maxQueries || 25;
  const deduplicated = Array.from(new Set(queries)).slice(0, limit);

  console.log(
    `[Query Planner] Generated ${deduplicated.length} deterministic query terms for ${targetCountry}.`,
  );
  return {
    queries: deduplicated,
  };
}

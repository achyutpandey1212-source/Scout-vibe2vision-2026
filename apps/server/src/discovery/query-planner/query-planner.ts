import { DiscoveryContext, QueryPlannerResponse } from '../types/query.types';
import { CATEGORY_REGISTRY, SourceCategory } from '@scout/shared';

// Deterministic query banks mapped to target categories.
// Formulated strictly for SEO space-separated keyword searches for early-career students.
const DETERMINISTIC_QUERIES: Record<string, string[]> = {
  INTERNSHIPS: [
    'software engineering internship',
    'frontend internship',
    'backend internship',
    'full stack internship',
    'ai internship',
    'ml internship',
    'data science internship',
    'cybersecurity internship',
    'cloud internship',
    'devops internship',
    'embedded systems internship',
    'electronics internship',
    'iot internship',
    'mobile development internship',
    'startup internship',
    'remote internship',
    'bangalore startup internship',
    'gurgaon startup internship',
    'hyderabad startup internship',
    'pune startup internship',
    'chennai startup internship',
    'noida startup internship',
    'student internship program',
    'graduate internship',
    'engineering internship',
    'sde internship',
    'summer internship',
    'winter internship',
    'off-cycle internship',
    'research internship',
    'bangalore startups hiring interns',
    'gurgaon startups hiring interns',
    'hyderabad startups hiring interns',
    'pune startups hiring interns',
    'chennai startups hiring interns',
    'noida startups hiring interns',
  ],
  HACKATHONS: [
    'student hackathon coding competition development',
    'devfolio student hackathon registration',
    'mlh major league hacking student events hackathons',
    'unstop student competition quiz challenge',
    'hackerearth hackerrank coding challenges students',
  ],
  SCHOLARSHIPS: [
    'engineering college scholarship female student',
    'bca bsc computer applications girls scholarship',
    'university computer science student fellowship grant',
    'merit based scholarship engineering students',
    'national scholarship portal nsp engineering application',
  ],
  GOVERNMENT_INTERNSHIP: [
    'isro student internship application',
    'drdo internship program application',
    'barc research student internship training',
    'aicte national internship portal student',
    'nic government internship computer science students',
    'cdac project associate internship training program',
    'meity student internship digital india learning',
    'rbi summer internship student application',
    'sebi student internship technology',
    'bel bhel ntpc gail ongc psu student internship',
    'smart india hackathon sih student registration',
    'toycathon student registration innovation challenge',
    'government innovation challenge student',
    'ministry student research program government',
  ],
  RESEARCH_INTERNSHIP: [
    'iisc research internship student summer program',
    'cern summer student programme physics computer science',
    'csir national lab student internship training',
    'dst research project internship fellowship engineering',
    'daad working internships science engineering research',
    'academic research ecosystem lab student internship',
  ],
  CAMPUS_AMBASSADOR: [
    'student campus representative program advocate',
    'github campus expert ambassador student program',
    'campus ambassador student internship recruit',
  ],
  OPEN_SOURCE_PROGRAM: [
    'gsoc google summer of code student project',
    'outreachy internship open source software',
    'lfx mentorship linux foundation program',
    'season of kde open source student program',
  ],
  WOMEN_IN_TECH: [
    'women techmakers scholar program',
    'outreachy internship open source women',
    'adobe women in technology scholarship',
    'grace hopper celebration student scholarship',
    'microsoft women engineers program mentorship',
    'women hackathon coding challenge',
    'girls in ai ml bootcamp mentorship',
    'anitab org student leadership program',
    'women engineers mentoring program',
  ],
  STUDENT_COMPETITION: [
    'student technology innovation challenge competition',
    'national college tech competition team registration',
    'global student coding challenge hack',
  ],
  SUMMER_SCHOOL: [
    'academic research summer school student',
    'scientific summer school program application',
    'cern summer student programme computer science',
  ],
  BOOTCAMP: [
    'free coding bootcamp web development student',
    'ai developer workshop machine learning certification',
    'student development bootcamp training program',
  ],
  FELLOWSHIPS: [
    'student fellowship technology leadership program',
    'early career researcher fellowship engineering',
    'open source fellowship program github mozilla',
    'social impact tech fellowship program',
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

  // Determine active categories and sort them by priority descending
  const sortedActiveCategories = CATEGORY_REGISTRY.filter((c) => c.isActive)
    .sort((a, b) => b.priority - a.priority)
    .map((c) => c.id as string);

  // If specific categories are requested, filter them to active ones, else use sortedActiveCategories
  const targetCategories =
    context.categories && context.categories.length > 0
      ? context.categories.filter((cat) => sortedActiveCategories.includes(cat))
      : sortedActiveCategories;

  for (const cat of targetCategories) {
    const templates = DETERMINISTIC_QUERIES[cat] || [];
    templates.forEach((q) => {
      const lowerQ = q.toLowerCase();
      if (!lowerQ.includes(targetCountry.toLowerCase())) {
        queries.push(`${q} ${targetCountry}`.toLowerCase());
      } else {
        queries.push(lowerQ);
      }
    });
  }

  // Deduplicate and slice to context limits or default budget limit
  const limit = context.maxQueries || 25;
  const deduplicated = Array.from(new Set(queries)).slice(0, limit);

  console.log(
    `[Query Planner] Generated ${deduplicated.length} deterministic query terms for ${targetCountry} across categories: ${targetCategories.join(', ')}.`,
  );
  return {
    queries: deduplicated,
  };
}

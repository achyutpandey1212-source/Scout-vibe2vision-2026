import { Opportunity } from '../../../discovery/extraction/types/opportunity.types';

export function matchEducation(qualification: string | undefined, opportunity: Opportunity) {
  if (!qualification) {
    return { score: 100, matched: ['No special degree restrictions'], missing: [] as string[] };
  }

  const text = (opportunity.description || '').toLowerCase();
  const qual = qualification.toLowerCase();

  let score = 100;
  const matched: string[] = [];
  const missing: string[] = [];

  // Check Master/PhD restrictions for school students
  const requiresMasters =
    text.includes('masters') || text.includes('postgraduate') || text.includes('phd');
  const isSchool = qual.includes('school') || qual.includes('10th') || qual.includes('12th');

  if (requiresMasters && isSchool) {
    score = 40;
    missing.push('Requires postgraduate degree');
  } else {
    matched.push('Academic level compatible');
  }

  return { score, matched, missing };
}

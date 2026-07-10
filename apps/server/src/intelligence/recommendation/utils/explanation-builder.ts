import { Opportunity } from '../../../discovery/extraction/types/opportunity.types';

export function buildExplanation(
  opportunity: Opportunity,
  matches: {
    interests: string[];
    types: string[];
    work: string[];
    education: string[];
    obstacles: string[];
  },
): string[] {
  const explanation: string[] = [];

  // 1. Interest matches
  if (matches.interests.length > 0) {
    explanation.push(`✓ Matches interest in ${matches.interests.join(', ')}`);
  }

  // 2. Type matches
  if (matches.types.length > 0) {
    explanation.push(`✓ Fits opportunity preferences (${matches.types.join(', ').toLowerCase()})`);
  }

  // 3. Remote/Hybrid matches
  if (matches.work.length > 0) {
    explanation.push(`✓ ${matches.work.join('/')} work preference compatible`);
  }

  // 4. Trust and Hidden Opportunities
  const intelligence = opportunity.intelligence;
  if (intelligence && intelligence.scores) {
    if (intelligence.scores.trust >= 80) {
      explanation.push(`✓ High Trust (${intelligence.scores.trust})`);
    }
    if (intelligence.scores.hidden >= 80) {
      explanation.push(`✓ Hidden Opportunity (${intelligence.scores.hidden})`);
    }
  }

  // 5. Deadline urgency
  if (intelligence && intelligence.daysRemaining !== null) {
    if (intelligence.daysRemaining > 0 && intelligence.daysRemaining <= 7) {
      explanation.push(`✓ Deadline in ${intelligence.daysRemaining} days`);
    }
  }

  return explanation;
}

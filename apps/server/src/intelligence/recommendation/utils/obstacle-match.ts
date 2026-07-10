import { Opportunity } from '../../../discovery/extraction/types/opportunity.types';

export function matchObstacles(obstacles: string[], opportunity: Opportunity) {
  if (!obstacles || obstacles.length === 0 || obstacles.includes('None of these')) {
    return { score: 100, matched: ['No significant obstacles flagged'], missing: [] as string[] };
  }

  const text = (opportunity.description || '').toLowerCase();
  let score = 100;
  const matched: string[] = [];
  const missing: string[] = [];

  if (obstacles.includes("I don't own a personal laptop")) {
    if (text.includes('personal laptop required') || text.includes('must have own computer')) {
      score -= 30;
      missing.push('Requires personal laptop');
    } else {
      matched.push('Mobile friendly or standard hardware');
    }
  }

  if (obstacles.includes("English isn't my strongest language")) {
    if (text.includes('excellent english verbal') || text.includes('must speak fluent english')) {
      score -= 20;
      missing.push('Requires fluent English communication');
    } else {
      matched.push('Acceptable local language boundaries');
    }
  }

  return {
    score: Math.max(score, 0),
    matched,
    missing,
  };
}

import { Opportunity } from '../../../discovery/extraction/types/opportunity.types';

export function matchInterests(userInterests: string[], opportunity: Opportunity) {
  if (!userInterests || userInterests.length === 0) {
    return { score: 100, matched: [] as string[], missing: [] as string[] };
  }

  const textToSearch = [opportunity.title, opportunity.organization, opportunity.description || '']
    .join(' ')
    .toLowerCase();

  const matched = userInterests.filter((interest) => textToSearch.includes(interest.toLowerCase()));
  const missing = userInterests.filter(
    (interest) => !textToSearch.includes(interest.toLowerCase()),
  );

  // If at least one interest matches, they get 100% of this section's score. Otherwise 0.
  const score = matched.length > 0 ? 100 : 0;

  return { score, matched, missing };
}

import { Opportunity } from '../../../discovery/extraction/types/opportunity.types';

export function matchWorkPreference(userPreferences: string[], opportunity: Opportunity) {
  if (!userPreferences || userPreferences.length === 0) {
    return { score: 100, matched: ['Flexible'], missing: [] as string[] };
  }

  const isRemote = opportunity.remote;
  const prefersRemote = userPreferences.includes('Remote');
  const prefersOnsite = userPreferences.includes('On-site');
  const prefersHybrid = userPreferences.includes('Hybrid');

  let matched = false;
  const matchedList: string[] = [];

  if (isRemote && prefersRemote) {
    matched = true;
    matchedList.push('Remote');
  }
  if (!isRemote && prefersOnsite) {
    matched = true;
    matchedList.push('On-site');
  }
  if (prefersHybrid) {
    // Hybrid matches both onsite and remote partially/fully
    matched = true;
    matchedList.push('Hybrid');
  }

  const score = matched ? 100 : 30;

  return {
    score,
    matched: matchedList,
    missing: !matched ? (isRemote ? ['Remote'] : ['On-site']) : [],
  };
}

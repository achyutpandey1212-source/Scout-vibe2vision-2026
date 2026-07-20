import { RankedQuery } from './query-generator';

export function diversifyQueries(queries: RankedQuery[], limit = 40): RankedQuery[] {
  // Sort descending by priorityScore initially
  const sorted = [...queries].sort((a, b) => b.priorityScore - a.priorityScore);

  const selected: RankedQuery[] = [];
  const selectedKeys = new Set<string>();

  // Tracks counts by persona and location to prevent single-category/single-location saturation
  const personaCounts: Record<string, number> = {};
  const locationCounts: Record<string, number> = {};

  let added = true;
  let pass = 1;

  while (selected.length < limit && added) {
    added = false;
    for (const q of sorted) {
      if (selected.length >= limit) break;
      if (selectedKeys.has(q.query)) continue;

      const pId = q.personaId;
      const loc = q.location;

      const pCount = personaCounts[pId] || 0;
      const lCount = locationCounts[loc] || 0;

      // Soft cap threshold increases with each pass
      const maxAllowedPerPersona = pass * 3;
      const maxAllowedPerLocation = pass * 4;

      if (pCount < maxAllowedPerPersona && lCount < maxAllowedPerLocation) {
        selected.push(q);
        selectedKeys.add(q.query);
        personaCounts[pId] = pCount + 1;
        locationCounts[loc] = lCount + 1;
        added = true;
      }
    }
    pass++;
    if (pass > 20) break;
  }

  // Fallback: If we still have slots remaining, fill up to limit with the highest-ranked remaining queries
  if (selected.length < limit) {
    for (const q of sorted) {
      if (selected.length >= limit) break;
      if (!selectedKeys.has(q.query)) {
        selected.push(q);
        selectedKeys.add(q.query);
      }
    }
  }

  return selected.slice(0, limit);
}

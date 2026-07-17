export class QueryDeduplicator {
  static normalize(query: string): string {
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\b(interns?|internship)\b/gi, 'intern')
      .replace(/\b(engineer|engineering)\b/gi, 'engineer')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static isSemanticDuplicate(a: string, b: string): boolean {
    const normalizedA = this.normalize(a);
    const normalizedB = this.normalize(b);
    if (normalizedA === normalizedB) return true;

    const wordsA = new Set(normalizedA.split(' '));
    const wordsB = new Set(normalizedB.split(' '));

    const intersection = [...wordsA].filter((w) => wordsB.has(w));
    const union = new Set([...wordsA, ...wordsB]);

    const jaccard = intersection.length / union.size;
    return jaccard >= 0.85;
  }

  static deduplicate(queries: string[]): { unique: string[]; removed: number } {
    const unique: string[] = [];
    const removed: number[] = [];

    for (let i = 0; i < queries.length; i++) {
      const current = queries[i];
      const normalizedCurrent = this.normalize(current);

      let isDuplicate = false;
      for (let j = 0; j < unique.length; j++) {
        if (this.isSemanticDuplicate(normalizedCurrent, this.normalize(unique[j]))) {
          isDuplicate = true;
          removed.push(i);
          break;
        }
      }

      if (!isDuplicate) {
        unique.push(current);
      }
    }

    return { unique, removed: removed.length };
  }
}

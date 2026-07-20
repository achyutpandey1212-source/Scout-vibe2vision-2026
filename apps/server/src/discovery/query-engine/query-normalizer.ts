export class QueryNormalizer {
  /**
   * Normalizes a search query string to check for duplicate search intent.
   * e.g. "site:lever.co software engineering intern Bangalore" and "site:lever.co SDE internship Bangalore"
   */
  static normalize(query: string): string {
    return query
      .toLowerCase()
      .replace(/site:[^\s]+/g, '') // remove site prefix for semantic comparison
      .replace(/[^\w\s]/g, ' ') // remove special chars
      .replace(/\s+/g, ' ') // collapse spacing
      .trim();
  }
}

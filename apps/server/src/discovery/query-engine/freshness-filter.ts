export class FreshnessFilter {
  /**
   * Evaluates listing text for expired years, application closed flags, or past deadlines pre-AI.
   */
  static isFresh(text: string): { fresh: boolean; reason?: string } {
    const lower = text.toLowerCase();

    // 1. Negative expiration indicators
    const closedIndicators = [
      'applications are closed',
      'applications closed',
      'no longer accepting applications',
      'job is closed',
      'role is closed',
      'hiring is closed',
      'position is closed',
      'deadline passed',
      'application deadline has passed',
      'this job is no longer active',
    ];

    for (const indicator of closedIndicators) {
      if (lower.includes(indicator)) {
        return { fresh: false, reason: `Match closed indicator: "${indicator}"` };
      }
    }

    // 2. Closed dates/past years
    const currentYear = new Date().getFullYear();
    const pastYears = [2022, 2023, 2024, 2025].filter((y) => y < currentYear);

    for (const year of pastYears) {
      const patternSummer = `summer ${year}`;
      const patternFall = `fall ${year}`;
      const patternSpring = `spring ${year}`;
      const patternInternship = `${year} internship`;

      if (
        lower.includes(patternSummer) ||
        lower.includes(patternFall) ||
        lower.includes(patternSpring) ||
        lower.includes(patternInternship)
      ) {
        return { fresh: false, reason: `Listing refers to past year target: ${year}` };
      }
    }

    return { fresh: true };
  }
}
export default FreshnessFilter;

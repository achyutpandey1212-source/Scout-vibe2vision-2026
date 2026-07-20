export class FreshnessFilter {
  /**
   * Evaluates listing text for expired keywords or past deadlines.
   */
  static isFresh(text: string, deadlineStr?: string | null): { fresh: boolean; reason?: string } {
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
      'registration closed',
      'archived',
      'closed on',
    ];

    for (const indicator of closedIndicators) {
      if (lower.includes(indicator)) {
        return { fresh: false, reason: `Match closed indicator: "${indicator}"` };
      }
    }

    // 2. Validate deadline date if explicitly parsed/available
    if (deadlineStr) {
      try {
        const deadlineDate = new Date(deadlineStr);
        if (!isNaN(deadlineDate.getTime())) {
          const now = new Date();
          // Reset hours to compare dates only
          now.setHours(0, 0, 0, 0);
          deadlineDate.setHours(0, 0, 0, 0);

          if (deadlineDate.getTime() < now.getTime()) {
            return { fresh: false, reason: `Extracted deadline (${deadlineStr}) is in the past` };
          }
        }
      } catch {
        // Ignored
      }
    }

    return { fresh: true };
  }
}
export default FreshnessFilter;

import { cleanText } from './text';

const MONTH_MAP: { [key: string]: number } = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

/**
 * Parses raw deadline string into an ISO YYYY-MM-DD date.
 * Returns null if the string cannot be parsed or if it indicates rolling/no deadline.
 */
export function parseDeadlineDate(
  deadlineText: string | null,
  referenceDate: Date = new Date(),
): Date | null {
  if (!deadlineText) return null;

  const cleaned = cleanText(deadlineText);

  // Exclude rolling or filled applications
  if (
    cleaned.includes('rolling') ||
    cleaned.includes('always open') ||
    cleaned.includes('until filled') ||
    cleaned.includes('tbd') ||
    cleaned.includes('n/a') ||
    cleaned.includes('no deadline')
  ) {
    return null;
  }

  // Helper to construct Date safely in UTC/Local midnight
  const makeDate = (year: number, monthIndex: number, day: number): Date => {
    return new Date(year, monthIndex, day, 0, 0, 0, 0);
  };

  // 1. Try DD/MM/YYYY or YYYY-MM-DD
  const slashDashRegex = new RegExp('(\\d{1,2})[/-](\\d{1,2})[/-](\\d{4})');
  const matchSlashDash = deadlineText.match(slashDashRegex);
  if (matchSlashDash) {
    const part1 = parseInt(matchSlashDash[1], 10);
    const part2 = parseInt(matchSlashDash[2], 10);
    const year = parseInt(matchSlashDash[3], 10);

    // Assume DD/MM/YYYY. If part2 > 12, check if it's MM/DD/YYYY
    if (part2 <= 12) {
      return makeDate(year, part2 - 1, part1);
    } else if (part1 <= 12) {
      return makeDate(year, part1 - 1, part2);
    }
  }

  // 2. Try YYYY-MM-DD
  const isoRegex = new RegExp('(\\d{4})[/-](\\d{1,2})[/-](\\d{1,2})');
  const matchIso = deadlineText.match(isoRegex);
  if (matchIso) {
    const year = parseInt(matchIso[1], 10);
    const month = parseInt(matchIso[2], 10);
    const day = parseInt(matchIso[3], 10);
    return makeDate(year, month - 1, day);
  }

  // 3. Try format: "15 Aug 2026", "August 15, 2026", "Apply before 15 Aug"
  // Normalize punctuation and retrieve words
  const words = cleaned
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  let day: number | null = null;
  let monthIndex: number | null = null;
  let year: number | null = null;

  // Search for month and day/year in the tokens
  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Check if it's a month
    if (MONTH_MAP[word] !== undefined) {
      monthIndex = MONTH_MAP[word];

      // Look for day nearby (before or after)
      const prevWord = words[i - 1];
      const nextWord = words[i + 1];

      // Helper to parse day from string like "15th", "1st", "2nd"
      const parseDayNum = (str: string | undefined): number | null => {
        if (!str) return null;
        const num = parseInt(str, 10);
        return !isNaN(num) && num >= 1 && num <= 31 ? num : null;
      };

      const parsedPrev = parseDayNum(prevWord);
      const parsedNext = parseDayNum(nextWord);

      if (parsedPrev !== null) {
        day = parsedPrev;
      } else if (parsedNext !== null) {
        day = parsedNext;
      }
    }

    // Check if it's a 4-digit year (e.g. 2024 to 2035)
    const num = parseInt(word, 10);
    if (!isNaN(num) && num >= 2024 && num <= 2035) {
      year = num;
    }
  }

  if (monthIndex !== null && day !== null) {
    // If year is not found, default to reference/current year
    const finalYear = year !== null ? year : referenceDate.getFullYear();
    let date = makeDate(finalYear, monthIndex, day);

    // If year wasn't specified and the date is already in the past by more than 6 months,
    // it's likely for the next year (e.g. current is Dec 2026, deadline says Jan 15)
    if (year === null) {
      const diffMs = date.getTime() - referenceDate.getTime();
      const sixMonthsInMs = 180 * 24 * 60 * 60 * 1000;
      if (diffMs < -sixMonthsInMs) {
        date = makeDate(finalYear + 1, monthIndex, day);
      }
    }
    return date;
  }

  return null;
}

/**
 * Computes the deadline status: ISO date, remaining days, and expiration flag.
 */
export function computeDeadlineStatus(
  deadlineText: string | null,
  referenceDateStr?: string,
): {
  normalizedDeadline: string | null;
  daysRemaining: number | null;
  expired: boolean;
} {
  const referenceDate = referenceDateStr ? new Date(referenceDateStr) : new Date();

  // Set referenceDate to local midnight to avoid timezone hours comparison issues
  const baseline = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    0,
    0,
    0,
    0,
  );

  const parsed = parseDeadlineDate(deadlineText, baseline);
  if (!parsed) {
    return {
      normalizedDeadline: null,
      daysRemaining: null,
      expired: false,
    };
  }

  // Format to YYYY-MM-DD
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  const formatted = `${yyyy}-${mm}-${dd}`;

  // Difference in days
  const diffTime = parsed.getTime() - baseline.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    normalizedDeadline: formatted,
    daysRemaining: diffDays,
    expired: diffDays < 0,
  };
}

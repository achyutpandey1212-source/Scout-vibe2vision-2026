import { DeadlineIntelligence } from '../types/opportunity.types';

export function parseDeadline(
  rawInput: string | null | undefined,
  currentLocalTime?: string,
): DeadlineIntelligence {
  const result: DeadlineIntelligence = {
    rawText: rawInput || null,
    type: 'UNKNOWN',
    normalizedDate: null,
    timezone: 'UTC',
    confidence: 0.2,
    daysRemaining: null,
    expired: false,
    displayLabel: 'Deadline Unknown',
  };

  if (!rawInput) {
    return result;
  }

  const clean = rawInput.trim();
  const lower = clean.toLowerCase();

  // Reference date: use mock/provided time or default to current time
  const now = currentLocalTime ? new Date(currentLocalTime) : new Date();
  const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  // 1. Check Ongoing, Rolling, Until Filled, Immediate
  if (
    lower.includes('rolling') ||
    lower.includes('apply anytime') ||
    lower.includes('accepted on rolling basis')
  ) {
    result.type = 'ROLLING';
    result.confidence = 0.98;
    result.displayLabel = 'Rolling Applications';
    return result;
  }

  if (
    lower.includes('until filled') ||
    lower.includes('until positions are filled') ||
    lower.includes('hiring until filled') ||
    lower.includes('open until vacancies close')
  ) {
    result.type = 'UNTIL_FILLED';
    result.confidence = 0.98;
    result.displayLabel = 'Until Filled';
    return result;
  }

  if (
    lower.includes('immediate') ||
    lower.includes('hiring now') ||
    lower.includes('join immediately')
  ) {
    result.type = 'IMMEDIATE';
    result.confidence = 0.98;
    result.displayLabel = 'Immediate Hiring';
    return result;
  }

  if (
    lower.includes('ongoing') ||
    lower.includes('always open') ||
    lower.includes('open year round') ||
    lower.includes('continuous intake') ||
    lower.includes('always accepting')
  ) {
    result.type = 'ONGOING';
    result.confidence = 0.98;
    result.displayLabel = 'Always Open';
    return result;
  }

  // 2. Relative date checks
  let relativeDays: number | null = null;
  let matches = false;

  if (lower === 'today') {
    relativeDays = 0;
    matches = true;
  } else if (lower === 'tomorrow') {
    relativeDays = 1;
    matches = true;
  } else if (lower === 'yesterday') {
    relativeDays = -1;
    matches = true;
  } else {
    // Matches "in X days", "X days left", "within X days"
    const daysMatch = lower.match(/(?:in\s+)?(\d+)\s*days?\s*(?:left|remaining)?/i);
    if (daysMatch) {
      relativeDays = parseInt(daysMatch[1], 10);
      matches = true;
    } else {
      // Matches "within two weeks", "within X weeks"
      const weeksMatch = lower.match(/(?:within\s+)?(?:two|(\d+))\s*weeks?/i);
      if (weeksMatch) {
        const weeks = weeksMatch[1] ? parseInt(weeksMatch[1], 10) : 2;
        relativeDays = weeks * 7;
        matches = true;
      } else {
        // Matches "48 hours left"
        const hoursMatch = lower.match(/(\d+)\s*hours?\s*left/i);
        if (hoursMatch) {
          const hours = parseInt(hoursMatch[1], 10);
          relativeDays = Math.ceil(hours / 24);
          matches = true;
        }
      }
    }
  }

  if (matches && relativeDays !== null) {
    const targetDate = new Date(todayStart.getTime());
    targetDate.setUTCDate(targetDate.getUTCDate() + relativeDays);
    const dateString = targetDate.toISOString().split('T')[0];

    result.type = 'FIXED_DATE';
    result.normalizedDate = dateString;
    result.daysRemaining = relativeDays;
    result.confidence = 0.98;
    result.expired = relativeDays < 0;
    result.displayLabel = getDisplayLabelForDays(relativeDays);
    return result;
  }

  // 3. Fixed Date Parsing attempts
  const parsedDate = tryParseFixedDate(clean, todayStart.getUTCFullYear());
  if (parsedDate) {
    const timeDiff = parsedDate.getTime() - todayStart.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

    result.type = 'FIXED_DATE';
    result.normalizedDate = parsedDate.toISOString().split('T')[0];
    result.daysRemaining = daysRemaining;
    result.confidence = 0.98;
    result.expired = daysRemaining < 0;
    result.displayLabel = getDisplayLabelForDays(daysRemaining);
    return result;
  }

  // Fallback to unknown if no classification matched
  return result;
}

function getDisplayLabelForDays(days: number): string {
  if (days < 0) return 'Expired';
  if (days === 0) return 'Closes Today';
  if (days === 1) return 'Closes Tomorrow';
  return `${days} Days Left`;
}

function tryParseFixedDate(str: string, currentYear: number): Date | null {
  // Try clean standard ISO format 2026-08-15
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const ts = Date.parse(str + 'T00:00:00Z');
    if (!isNaN(ts)) return new Date(ts);
  }

  // Try standard parseable formats
  const cleanStr = str.replace(/(st|nd|rd|th)/gi, ''); // strip 15th, 23rd, etc.

  // If no year specified, Date.parse might fallback to 2001 or current system year.
  // We want to force currentYear if no 4-digit year is present in the string.
  const hasYear = /\b\d{4}\b/.test(cleanStr);
  if (!hasYear) {
    // Regex check for month name and day, then append year
    const monthDayRegex =
      /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*(\d{1,2})|(\d{1,2})\s*(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)/i;
    const match = cleanStr.match(monthDayRegex);
    if (match) {
      const month = match[1] || match[4];
      const day = match[2] || match[3];
      const testStr = `${month} ${day}, ${currentYear} GMT`;
      const parsedTs = Date.parse(testStr);
      if (!isNaN(parsedTs)) {
        return new Date(parsedTs);
      }
    }
  }

  const ts = Date.parse(cleanStr + ' GMT');
  if (!isNaN(ts)) {
    const parsedDate = new Date(ts);
    // If the parsed year parsed by Date.parse does not match string and is weirdly old (like 2001 default)
    if (!hasYear && parsedDate.getFullYear() !== currentYear) {
      parsedDate.setFullYear(currentYear);
    }
    return parsedDate;
  }

  // Regex fallback: e.g. "15 Aug 2026", "15 August", "August 15", "15 Aug"
  // Group 1: Day (optional), Group 2: Month, Group 3: Day (if not first), Group 4: Year (optional)
  const monthRegex =
    /(?:(\d{1,2})\s+)?(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s+(\d{1,2}))?(?:\s*,?\s*(\d{4}))?/i;
  const match = cleanStr.match(monthRegex);
  if (match) {
    const day = parseInt(match[1] || match[3] || '1', 10);
    const month = match[2];
    const year = match[4] ? parseInt(match[4], 10) : currentYear;

    const testStr = `${month} ${day}, ${year} GMT`;
    const parsedTs = Date.parse(testStr);
    if (!isNaN(parsedTs)) {
      return new Date(parsedTs);
    }
  }

  // Regex match DD/MM/YYYY
  const slashMatch = cleanStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const day = parseInt(slashMatch[1], 10);
    const month = parseInt(slashMatch[2], 10);
    const year = parseInt(slashMatch[3], 10);
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00Z`;
    const ts = Date.parse(dateStr);
    if (!isNaN(ts)) {
      return new Date(ts);
    }
  }

  return null;
}

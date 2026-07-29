import { describe, it, expect } from 'vitest';
import { parseDeadline } from './deadline-parser';

describe('Deadline Parser Utility Tests', () => {
  const mockCurrentTime = '2026-07-29T12:00:00Z'; // Current time context

  describe('1. Fixed Dates', () => {
    it('should normalize standard ISO date format', () => {
      const res = parseDeadline('2026-08-15', mockCurrentTime);
      expect(res.type).toBe('FIXED_DATE');
      expect(res.normalizedDate).toBe('2026-08-15');
      expect(res.confidence).toBe(0.98);
      expect(res.daysRemaining).toBe(17);
      expect(res.expired).toBe(false);
      expect(res.displayLabel).toBe('17 Days Left');
    });

    it('should parse human readable formats: 15 Aug 2026', () => {
      const res = parseDeadline('15 Aug 2026', mockCurrentTime);
      expect(res.type).toBe('FIXED_DATE');
      expect(res.normalizedDate).toBe('2026-08-15');
      expect(res.daysRemaining).toBe(17);
      expect(res.displayLabel).toBe('17 Days Left');
    });

    it('should parse: 15 August', () => {
      const res = parseDeadline('15 August', mockCurrentTime);
      expect(res.type).toBe('FIXED_DATE');
      expect(res.normalizedDate).toBe('2026-08-15');
    });

    it('should parse: August 15', () => {
      const res = parseDeadline('August 15', mockCurrentTime);
      expect(res.type).toBe('FIXED_DATE');
      expect(res.normalizedDate).toBe('2026-08-15');
    });

    it('should parse formats with slashes: 15/08/2026', () => {
      const res = parseDeadline('15/08/2026', mockCurrentTime);
      expect(res.type).toBe('FIXED_DATE');
      expect(res.normalizedDate).toBe('2026-08-15');
    });
  });

  describe('2. Relative Dates', () => {
    it('should handle today', () => {
      const res = parseDeadline('Today', mockCurrentTime);
      expect(res.type).toBe('FIXED_DATE');
      expect(res.normalizedDate).toBe('2026-07-29');
      expect(res.daysRemaining).toBe(0);
      expect(res.expired).toBe(false);
      expect(res.displayLabel).toBe('Closes Today');
    });

    it('should handle tomorrow', () => {
      const res = parseDeadline('Tomorrow', mockCurrentTime);
      expect(res.type).toBe('FIXED_DATE');
      expect(res.normalizedDate).toBe('2026-07-30');
      expect(res.daysRemaining).toBe(1);
      expect(res.expired).toBe(false);
      expect(res.displayLabel).toBe('Closes Tomorrow');
    });

    it('should handle "in 3 days"', () => {
      const res = parseDeadline('in 3 days', mockCurrentTime);
      expect(res.type).toBe('FIXED_DATE');
      expect(res.normalizedDate).toBe('2026-08-01');
      expect(res.daysRemaining).toBe(3);
      expect(res.displayLabel).toBe('3 Days Left');
    });

    it('should handle "Within two weeks"', () => {
      const res = parseDeadline('Within two weeks', mockCurrentTime);
      expect(res.type).toBe('FIXED_DATE');
      expect(res.normalizedDate).toBe('2026-08-12');
      expect(res.daysRemaining).toBe(14);
      expect(res.displayLabel).toBe('14 Days Left');
    });

    it('should handle "48 hours left"', () => {
      const res = parseDeadline('48 hours left', mockCurrentTime);
      expect(res.type).toBe('FIXED_DATE');
      expect(res.normalizedDate).toBe('2026-07-31');
      expect(res.daysRemaining).toBe(2);
      expect(res.displayLabel).toBe('2 Days Left');
    });
  });

  describe('3. Deadline Classifications', () => {
    it('should classify rolling', () => {
      const res = parseDeadline('Rolling Applications', mockCurrentTime);
      expect(res.type).toBe('ROLLING');
      expect(res.confidence).toBe(0.98);
      expect(res.displayLabel).toBe('Rolling Applications');
    });

    it('should classify until filled', () => {
      const res = parseDeadline('Until Filled', mockCurrentTime);
      expect(res.type).toBe('UNTIL_FILLED');
      expect(res.confidence).toBe(0.98);
      expect(res.displayLabel).toBe('Until Filled');
    });

    it('should classify immediate', () => {
      const res = parseDeadline('Immediate Hiring', mockCurrentTime);
      expect(res.type).toBe('IMMEDIATE');
      expect(res.confidence).toBe(0.98);
      expect(res.displayLabel).toBe('Immediate Hiring');
    });

    it('should classify ongoing / always open', () => {
      const res = parseDeadline('Always Open', mockCurrentTime);
      expect(res.type).toBe('ONGOING');
      expect(res.confidence).toBe(0.98);
      expect(res.displayLabel).toBe('Always Open');
    });

    it('should default to unknown', () => {
      const res = parseDeadline('Some weird text', mockCurrentTime);
      expect(res.type).toBe('UNKNOWN');
      expect(res.confidence).toBe(0.2);
      expect(res.displayLabel).toBe('Deadline Unknown');
    });
  });

  describe('4. Expired Dates', () => {
    it('should correctly mark expired fixed dates in the past', () => {
      const res = parseDeadline('2026-07-20', mockCurrentTime);
      expect(res.type).toBe('FIXED_DATE');
      expect(res.daysRemaining).toBeLessThan(0);
      expect(res.expired).toBe(true);
      expect(res.displayLabel).toBe('Expired');
    });
  });
});

import { describe, it, expect } from 'vitest';
import { normalizeUrl } from '../../search/search-orchestrator';
import {
  normalizeDate,
  normalizeOrganization,
  normalizeEnum,
  normalizeOpportunity,
} from './normalizers';

describe('Sprint 1 — Extraction & Cleanup Normalization tests', () => {
  describe('1. Canonical URL Normalization', () => {
    it('should strip common tracking parameters and hashes', () => {
      const url =
        'https://example.com/apply?utm_source=twitter&utm_medium=social&ref=homepage&source=feed#apply-now';
      expect(normalizeUrl(url)).toBe('https://example.com/apply');
    });

    it('should normalize hostnames and remove trailing slashes', () => {
      const url = 'HTTP://www.Google.com/Careers/';
      expect(normalizeUrl(url)).toBe('http://google.com/careers');
    });

    it('should preserve legitimate, non-tracking query parameters', () => {
      const url = 'https://example.com/job?id=12345&category=tech';
      expect(normalizeUrl(url)).toBe('https://example.com/job?id=12345&category=tech');
    });
  });

  describe('2. Expiry Date Normalization', () => {
    it('should convert parseable formats to standard ISO YYYY-MM-DD format', () => {
      expect(normalizeDate('30 August 2026')).toBe('2026-08-30');
      expect(normalizeDate('Aug 30, 2026')).toBe('2026-08-30');
      expect(normalizeDate('2026/08/30')).toBe('2026-08-30');
    });

    it('should capture recognized status keywords', () => {
      expect(normalizeDate('Rolling application')).toBe('Rolling');
      expect(normalizeDate('open until filled')).toBe('Open until filled');
      expect(normalizeDate('TBA')).toBe('Deadline not announced');
    });

    it('should reject unparseable/broken formats by returning null', () => {
      expect(normalizeDate('before winter')).toBeNull();
      expect(normalizeDate('soon')).toBeNull();
    });
  });

  describe('3. Deterministic Organization Extraction', () => {
    it('should map known domains to their canonical representation', () => {
      expect(normalizeOrganization('Google Inc.', 'google.com')).toBe('Google');
      expect(normalizeOrganization('WTM Careers', 'womentechmakers.com')).toBe('Women Techmakers');
      expect(normalizeOrganization('AnitaB Org', 'anitab.org')).toBe('AnitaB.org');
    });

    it('should strip generic corporate boilerplate suffixes', () => {
      expect(normalizeOrganization('Microsoft Corporation', null)).toBe('Microsoft');
      expect(normalizeOrganization('Oracle LLC Corp', null)).toBe('Oracle');
      expect(normalizeOrganization('Uber Careers', null)).toBe('Uber');
    });
  });

  describe('4. Enum Value Normalization', () => {
    it('should match direct uppercase string formats', () => {
      const allowed = ['INTERNSHIP', 'STARTUP_INTERNSHIP', 'SCHOLARSHIP'];
      expect(normalizeEnum('internship', allowed, 'INTERNSHIP')).toBe('INTERNSHIP');
      expect(normalizeEnum('SCHOLARSHIPS', allowed, 'INTERNSHIP')).toBe('SCHOLARSHIP'); // singularizes automatically
    });

    it('should fallback to default value when string does not map to enum', () => {
      const allowed = ['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN'];
      expect(normalizeEnum('extremely-high', allowed, 'UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('5. Untitled Rejection Logic', () => {
    it('should clear title to empty string when placeholder titles are provided', () => {
      const opp1 = { title: 'Untitled Opportunity', description: 'desc', summary: 'sum' };
      const opp2 = { title: 'N/A', description: 'desc', summary: 'sum' };
      const opp3 = { title: 'Valid Tech Internship', description: 'desc', summary: 'sum' };

      expect(normalizeOpportunity(opp1).title).toBe('');
      expect(normalizeOpportunity(opp2).title).toBe('');
      expect(normalizeOpportunity(opp3).title).toBe('Valid Tech Internship');
    });
  });

  describe('6. Stage 4.1 Provider Alias Mapping Layer', () => {
    it('should map provider specific alias attributes to Scout canonical properties', () => {
      const providerOutput = {
        opportunityName: 'Google Summer of Code',
        deadline: '2026-11-20',
        stipend: 1500,
        applicationProcess: 'Apply online through portal.',
        confidenceEstimator: 0.99,
        officialWeb: 'https://summerofcode.withgoogle.com',
      };

      const normalized = normalizeOpportunity(providerOutput);
      expect(normalized.title).toBe('Google Summer of Code');
      expect(normalized.deadline).toBe('2026-11-20');
      expect(normalized.salary).toBe(1500);
      expect(normalized.stipend).toBe(1500); // verify mapped compatibility
      expect(normalized.selectionProcess).toBe('Apply online through portal.');
      expect(normalized.confidence).toBe(0.99);
      expect(normalized.officialWebsite).toBe('https://summerofcode.withgoogle.com');

      // Check normalization change logs
      expect(normalized._normalizationChanges).toBeDefined();
      expect(normalized._normalizationChanges.length).toBeGreaterThan(0);
    });
  });
});

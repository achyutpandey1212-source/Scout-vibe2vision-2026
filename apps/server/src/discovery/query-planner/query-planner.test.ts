import { describe, it, expect } from 'vitest';
import { generateSearchQueries } from './query-planner';
import { ACTIVE_SOURCE_CATEGORIES, CANONICAL_TARGET_AUDIENCE } from '@scout/shared';
import { DiscoveryMission } from '../types/query.types';

const BASE_CONTEXT = {
  categories: ACTIVE_SOURCE_CATEGORIES,
  targetAudience: CANONICAL_TARGET_AUDIENCE,
  country: 'India',
  maxQueries: 25,
};

describe('MissionQueryPlanner', () => {
  const missions: DiscoveryMission[] = [
    'ENGINEERING_INTERNSHIPS',
    'STARTUP_INTERNSHIPS',
    'GOVERNMENT_TECH_INTERNSHIPS',
    'RESEARCH_INTERNSHIPS',
    'HACKATHONS',
  ];

  for (const mission of missions) {
    it(`generates a valid plan for ${mission}`, async () => {
      const result = await generateSearchQueries({
        ...BASE_CONTEXT,
        mission,
      });

      expect(result.mission).toBe(mission);
      expect(result.configuration.mission).toBe(mission);
      expect(result.queries.length).toBeGreaterThan(0);
      expect(result.plannedQueries.length).toBe(result.queries.length);
      expect(result.meta.finalQueries).toBe(result.queries.length);
      expect(result.queries.length).toBeLessThanOrEqual(BASE_CONTEXT.maxQueries);
    });

    it(`produces deterministic output for ${mission}`, async () => {
      const result1 = await generateSearchQueries({
        ...BASE_CONTEXT,
        mission,
      });
      const result2 = await generateSearchQueries({
        ...BASE_CONTEXT,
        mission,
      });

      expect(result1.queries).toEqual(result2.queries);
      expect(result1.plannedQueries.map((q) => q.query)).toEqual(
        result2.plannedQueries.map((q) => q.query),
      );
      expect(result1.meta.finalQueries).toBe(result2.meta.finalQueries);
      expect(result1.meta.totalGenerated).toBe(result2.meta.totalGenerated);
    });

    it(`returns structured planned queries for ${mission}`, async () => {
      const result = await generateSearchQueries({
        ...BASE_CONTEXT,
        mission,
      });

      for (const pq of result.plannedQueries) {
        expect(pq.query).toBeTruthy();
        expect(['high', 'medium', 'low']).toContain(pq.priority);
        expect(pq.priorityScore).toBeGreaterThanOrEqual(0);
        expect(pq.priorityScore).toBeLessThanOrEqual(100);
        expect([
          'INTENT',
          'ECOSYSTEM',
          'LOCATION',
          'COMPANY',
          'ATS',
          'OFFICIAL',
          'COMMUNITY',
        ]).toContain(pq.strategy);
        expect(pq.purpose).toBeTruthy();
        expect(pq.explanation).toBeTruthy();
        expect(pq.budget).toBeGreaterThanOrEqual(0);
        expect(pq.depth).toBeGreaterThanOrEqual(1);
        expect(pq.reason).toBeTruthy();
      }
    });

    it(`deduplicates queries for ${mission}`, async () => {
      const result = await generateSearchQueries({
        ...BASE_CONTEXT,
        mission,
      });

      const uniqueQueries = new Set(result.queries.map((q) => q.toLowerCase()));
      expect(uniqueQueries.size).toBe(result.queries.length);
    });

    it(`assigns valid priorities for ${mission}`, async () => {
      const result = await generateSearchQueries({
        ...BASE_CONTEXT,
        mission,
      });

      const priorities = result.plannedQueries.map((q) => q.priority);
      expect(priorities.length).toBeGreaterThan(0);
      for (const p of priorities) {
        expect(['high', 'medium', 'low']).toContain(p);
      }
    });

    it(`calculates diversity metrics for ${mission}`, async () => {
      const result = await generateSearchQueries({
        ...BASE_CONTEXT,
        mission,
      });

      expect(result.meta.diversity).toBeDefined();
      expect(result.meta.diversity.intent).toBeGreaterThanOrEqual(0);
      expect(result.meta.diversity.strategy).toBeGreaterThanOrEqual(0);
    });
  }

  it('defaults to ENGINEERING_INTERNSHIPS when no mission is specified', async () => {
    const result = await generateSearchQueries({
      ...BASE_CONTEXT,
    });

    expect(result.mission).toBe('ENGINEERING_INTERNSHIPS');
  });

  it('includes ATS queries for ENGINEERING_INTERNSHIPS', async () => {
    const result = await generateSearchQueries({
      ...BASE_CONTEXT,
      mission: 'ENGINEERING_INTERNSHIPS',
    });

    const atsQueries = result.plannedQueries.filter((q) => q.strategy === 'ATS');
    expect(atsQueries.length).toBeGreaterThan(0);
    expect(atsQueries.every((q) => q.expectedATS)).toBe(true);
  });

  it('includes ecosystem queries for STARTUP_INTERNSHIPS', async () => {
    const result = await generateSearchQueries({
      ...BASE_CONTEXT,
      mission: 'STARTUP_INTERNSHIPS',
    });

    const ecosystemQueries = result.plannedQueries.filter((q) => q.strategy === 'ECOSYSTEM');
    expect(ecosystemQueries.length).toBeGreaterThan(0);
    expect(ecosystemQueries.every((q) => q.expectedEcosystem)).toBe(true);
  });

  it('includes company discovery queries for ENGINEERING_INTERNSHIPS', async () => {
    const result = await generateSearchQueries({
      ...BASE_CONTEXT,
      mission: 'ENGINEERING_INTERNSHIPS',
    });

    const companyQueries = result.plannedQueries.filter((q) => q.strategy === 'COMPANY');
    expect(companyQueries.length).toBeGreaterThan(0);
    expect(companyQueries.every((q) => q.expectedSourceType === 'COMPANY')).toBe(true);
  });

  it('respects maxQueries limit', async () => {
    const result = await generateSearchQueries({
      ...BASE_CONTEXT,
      mission: 'ENGINEERING_INTERNSHIPS',
      maxQueries: 10,
    });

    expect(result.queries.length).toBeLessThanOrEqual(10);
    expect(result.plannedQueries.length).toBeLessThanOrEqual(10);
  });

  it('returns backward-compatible flat queries array', async () => {
    const result = await generateSearchQueries({
      ...BASE_CONTEXT,
      mission: 'ENGINEERING_INTERNSHIPS',
    });

    expect(Array.isArray(result.queries)).toBe(true);
    expect(result.queries.every((q) => typeof q === 'string')).toBe(true);
    expect(result.queries.length).toBe(result.plannedQueries.length);
  });

  it('calculates correct meta for ENGINEERING_INTERNSHIPS', async () => {
    const result = await generateSearchQueries({
      ...BASE_CONTEXT,
      mission: 'ENGINEERING_INTERNSHIPS',
      maxQueries: 25,
    });

    expect(result.meta.strategiesUsed.ATS).toBeGreaterThan(0);
    expect(result.meta.strategiesUsed.COMPANY).toBeGreaterThan(0);
    expect(result.meta.budgetUtilization).toBeGreaterThan(0);
    expect(result.meta.finalQueries).toBe(result.queries.length);
  });

  it('calculates correct meta for STARTUP_INTERNSHIPS', async () => {
    const result = await generateSearchQueries({
      ...BASE_CONTEXT,
      mission: 'STARTUP_INTERNSHIPS',
      maxQueries: 25,
    });

    expect(result.meta.strategiesUsed.ATS).toBeGreaterThan(0);
    expect(result.meta.strategiesUsed.COMPANY).toBeGreaterThan(0);
    expect(result.meta.ecosystemsCovered.length).toBeGreaterThan(0);
  });

  it('has no ATS queries for GOVERNMENT_TECH_INTERNSHIPS', async () => {
    const result = await generateSearchQueries({
      ...BASE_CONTEXT,
      mission: 'GOVERNMENT_TECH_INTERNSHIPS',
      maxQueries: 25,
    });

    const atsQueries = result.plannedQueries.filter((q) => q.strategy === 'ATS');
    expect(atsQueries.length).toBe(0);
  });

  it('includes location queries for missions with priority cities', async () => {
    const result = await generateSearchQueries({
      ...BASE_CONTEXT,
      mission: 'ENGINEERING_INTERNSHIPS',
      maxQueries: 25,
    });

    const locationQueries = result.plannedQueries.filter((q) => q.strategy === 'LOCATION');
    expect(locationQueries.length).toBeGreaterThan(0);
    expect(locationQueries.every((q) => q.expectedLocation)).toBe(true);
  });

  it('assigns deterministic priority scores', async () => {
    const result = await generateSearchQueries({
      ...BASE_CONTEXT,
      mission: 'ENGINEERING_INTERNSHIPS',
    });

    const scores = result.plannedQueries.map((q) => q.priorityScore);
    expect(scores.every((s) => s >= 0 && s <= 100)).toBe(true);
    const sorted = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sorted);
  });

  it('includes purpose and explanation for every query', async () => {
    const result = await generateSearchQueries({
      ...BASE_CONTEXT,
      mission: 'ENGINEERING_INTERNSHIPS',
    });

    for (const pq of result.plannedQueries) {
      expect(pq.purpose).toBeTruthy();
      expect(pq.explanation).toBeTruthy();
      expect(typeof pq.purpose).toBe('string');
      expect(typeof pq.explanation).toBe('string');
    }
  });

  it('enforces budget slots per strategy', async () => {
    const result = await generateSearchQueries({
      ...BASE_CONTEXT,
      mission: 'ENGINEERING_INTERNSHIPS',
      maxQueries: 25,
    });

    const strategies = result.plannedQueries.map((q) => q.strategy);
    const atsCount = strategies.filter((s) => s === 'ATS').length;
    const companyCount = strategies.filter((s) => s === 'COMPANY').length;

    expect(atsCount).toBeGreaterThan(0);
    expect(companyCount).toBeGreaterThan(0);
    expect(result.meta.finalQueries).toBeLessThanOrEqual(25);
  });
});

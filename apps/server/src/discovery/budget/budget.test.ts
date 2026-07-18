import { describe, it, expect } from 'vitest';
import { PlannedQuery, SearchStrategy } from '../types/query.types';
import { DiscoveryMission } from '../types/query.types';
import { BUDGET_CONFIG } from './budget-config';
import { allocateMissions, computeMissionShares, assignWithGuarantee } from './mission-budget';
import { allocateStrategies, computeStrategyShares } from './strategy-budget';
import { allocateBudget, validateAllocation } from './budget-allocator';
import {
  computeBudgetScore,
  runBudgetEngine,
  buildSignals,
  missionPriority,
  strategyPriority,
} from './budget-engine';
import { buildUtilizationReport } from './budget-report';
import { BudgetScoreSignals } from './budget.types';

function makeQuery(over: Partial<PlannedQuery> = {}): PlannedQuery {
  return {
    query: 'test query',
    priority: 'high',
    priorityScore: 80,
    category: 'SEARCH_RESULT' as PlannedQuery['category'],
    tags: [],
    expectedOpportunityType: 'INTERNSHIP',
    strategy: 'ATS',
    purpose: 'DISCOVER_ATS' as PlannedQuery['purpose'],
    expectedSourceType: 'SEARCH_API',
    reason: 'r',
    explanation: 'e',
    budget: 0.1,
    depth: 1,
    ...over,
  };
}

describe('Budget Configuration', () => {
  it('mission weights are all positive and enabled by default', () => {
    for (const m of BUDGET_CONFIG.missions) {
      expect(m.weight).toBeGreaterThan(0);
      expect(m.enabled).toBe(true);
    }
  });

  it('every configured mission has strategy weights', () => {
    for (const m of BUDGET_CONFIG.missions) {
      const sw = BUDGET_CONFIG.strategyWeights[m.mission];
      expect(sw).toBeTruthy();
      expect(sw!.length).toBeGreaterThan(0);
    }
  });
});

describe('Mission Budget', () => {
  it('mission shares sum to exactly 1', () => {
    const shares = computeMissionShares();
    const sum = Object.values(shares).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1)).toBeLessThan(1e-9);
  });

  it('Engineering gets the largest share (40%)', () => {
    const shares = computeMissionShares();
    expect(shares.ENGINEERING_INTERNSHIPS).toBeCloseTo(0.4, 6);
    expect(shares.STARTUP_INTERNSHIPS).toBeCloseTo(0.25, 6);
  });

  it('scales proportionally with the requested budget (20 vs 80)', () => {
    const small = allocateMissions(20);
    const large = allocateMissions(80);
    // Share is invariant regardless of absolute budget size.
    const smallEng = small.find((m) => m.mission === 'ENGINEERING_INTERNSHIPS')!;
    const largeEng = large.find((m) => m.mission === 'ENGINEERING_INTERNSHIPS')!;
    expect(largeEng.share).toBeCloseTo(smallEng.share, 9);
    // The allocation always exactly consumes the requested budget (min guarantee caps reserve).
    expect(small.reduce((s, m) => s + m.slots, 0)).toBe(20);
    expect(large.reduce((s, m) => s + m.slots, 0)).toBe(80);
  });

  it('slot counts grow monotonically with budget for the top mission', () => {
    const a = allocateMissions(20).find((m) => m.mission === 'ENGINEERING_INTERNSHIPS')!.slots;
    const b = allocateMissions(80).find((m) => m.mission === 'ENGINEERING_INTERNSHIPS')!.slots;
    expect(b).toBeGreaterThan(a);
  });

  it('every enabled mission receives at least the minimum guarantee', () => {
    const allocated = allocateMissions(3);
    for (const m of allocated) {
      expect(m.slots).toBeGreaterThanOrEqual(BUDGET_CONFIG.minMissionGuarantee);
    }
  });
});

describe('assignWithGuarantee', () => {
  it('distributes exactly the total with no overflow', () => {
    const out = assignWithGuarantee(
      [
        { key: 'a', weight: 40 },
        { key: 'b', weight: 25 },
        { key: 'c', weight: 15 },
        { key: 'd', weight: 10 },
        { key: 'e', weight: 10 },
      ],
      60,
      1,
    );
    const total = Object.values(out).reduce((a, b) => a + b, 0);
    expect(total).toBe(60);
  });

  it('guarantees a minimum to every eligible item', () => {
    const out = assignWithGuarantee(
      [
        { key: 'a', weight: 100 },
        { key: 'b', weight: 1 },
      ],
      5,
      2,
    );
    expect(out.a).toBeGreaterThanOrEqual(2);
    expect(out.b).toBeGreaterThanOrEqual(2);
  });
});

describe('Strategy Budget', () => {
  it('strategy shares for Engineering sum to 1', () => {
    const shares = computeStrategyShares('ENGINEERING_INTERNSHIPS');
    const sum = Object.values(shares).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1)).toBeLessThan(1e-9);
  });

  it('ATS is the largest Engineering strategy (35%)', () => {
    const shares = computeStrategyShares('ENGINEERING_INTERNSHIPS');
    expect(shares.ATS).toBeCloseTo(0.35, 6);
  });

  it('scales strategy slots with the mission budget', () => {
    const a = allocateStrategies('ENGINEERING_INTERNSHIPS', 20);
    const b = allocateStrategies('ENGINEERING_INTERNSHIPS', 40);
    const aAts = a.find((s) => s.strategy === 'ATS')!;
    const bAts = b.find((s) => s.strategy === 'ATS')!;
    // Share is invariant regardless of absolute mission budget.
    expect(bAts.share).toBeCloseTo(aAts.share, 9);
    expect(a.reduce((s, x) => s + x.slots, 0)).toBe(20);
    expect(b.reduce((s, x) => s + x.slots, 0)).toBe(40);
  });

  it('every enabled strategy gets at least the minimum guarantee', () => {
    const allocated = allocateStrategies('HACKATHONS', 4);
    for (const s of allocated) {
      expect(s.slots).toBeGreaterThanOrEqual(BUDGET_CONFIG.minStrategyGuarantee);
    }
  });
});

describe('Budget Allocator Validation', () => {
  it('a fresh allocation is valid and matches the requested budget', () => {
    const alloc = allocateBudget(60);
    expect(alloc.validation.valid).toBe(true);
    expect(alloc.validation.budgetMatches).toBe(true);
    expect(alloc.validation.noUnusedBudget).toBe(true);
    expect(alloc.validation.noStrategyOverflow).toBe(true);
    expect(alloc.validation.missionShareSum).toBeCloseTo(1, 6);
  });

  it('flags negative slots', () => {
    const missions = allocateMissions(60);
    missions[0].slots = -1;
    const v = validateAllocation(60, missions);
    expect(v.valid).toBe(false);
    expect(v.errors.some((e) => e.includes('negative'))).toBe(true);
  });
});

describe('Budget Score & Ranking', () => {
  it('combines signals into a deterministic 0-100 score', () => {
    const signals: BudgetScoreSignals = {
      queryPriority: 95,
      companyPriority: 90,
      ecosystemYield: 'VERY_HIGH',
      strategyPriority: 1,
      missionPriority: 1,
      cityPriority: 80,
    };
    const score = computeBudgetScore(signals);
    expect(score).toBeGreaterThan(90);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('scores identical inputs identically (deterministic)', () => {
    const signals: BudgetScoreSignals = {
      queryPriority: 80,
      companyPriority: 50,
      ecosystemYield: 'HIGH',
      strategyPriority: 2,
      missionPriority: 1,
      cityPriority: 40,
    };
    expect(computeBudgetScore(signals)).toBe(computeBudgetScore({ ...signals }));
  });

  it('higher yield produces a higher score', () => {
    const base: BudgetScoreSignals = {
      queryPriority: 80,
      companyPriority: 50,
      ecosystemYield: 'MEDIUM',
      strategyPriority: 2,
      missionPriority: 2,
      cityPriority: 40,
    };
    const lowYield = computeBudgetScore(base);
    const highYield = computeBudgetScore({ ...base, ecosystemYield: 'VERY_HIGH' });
    expect(highYield).toBeGreaterThan(lowYield);
  });

  it('buildSignals reads config-driven mission/strategy priority', () => {
    const s = buildSignals(makeQuery({ strategy: 'ATS' }), 'ENGINEERING_INTERNSHIPS');
    expect(s.missionPriority).toBe(missionPriority('ENGINEERING_INTERNSHIPS'));
    expect(s.strategyPriority).toBe(strategyPriority('ENGINEERING_INTERNSHIPS', 'ATS'));
  });
});

describe('Budget Engine (end to end)', () => {
  const mission: DiscoveryMission = 'ENGINEERING_INTERNSHIPS';
  const queries: PlannedQuery[] = [
    makeQuery({
      query: 'Greenhouse ATS',
      strategy: 'ATS',
      priorityScore: 96,
      expectedCompanyPriority: 95,
      expectedEcosystem: 'Y Combinator',
    }),
    makeQuery({
      query: 'Google Careers',
      strategy: 'COMPANY',
      priorityScore: 92,
      expectedCompanyPriority: 95,
    }),
    makeQuery({
      query: 'YC Portfolio',
      strategy: 'ECOSYSTEM',
      priorityScore: 90,
      expectedEcosystem: 'Y Combinator',
    }),
    makeQuery({
      query: 'Bengaluru intern',
      strategy: 'LOCATION',
      priorityScore: 70,
      expectedCityPriority: 90,
    }),
    makeQuery({ query: 'Generic internship', strategy: 'INTENT', priorityScore: 50 }),
  ];

  it('ranks queries and funds the top per strategy', () => {
    const res = runBudgetEngine(mission, queries);
    expect(res.ranked.length).toBe(queries.length);
    // Rank is 1-based, highest first.
    expect(res.ranked[0].budgetRank).toBe(res.ranked.length);
    // Funded count never exceeds the allocation.
    expect(res.funded.length).toBeLessThanOrEqual(res.allocation.totalBudget);
  });

  it('funded queries are exactly the highest-budget-ranked ones', () => {
    const res = runBudgetEngine(mission, queries);
    const fundedSorted = res.funded
      .slice()
      .sort((a, b) => b.budgetScore - a.budgetScore || a.query.localeCompare(b.query));
    const expected = res.ranked
      .slice()
      .sort((a, b) => b.budgetScore - a.budgetScore || a.query.localeCompare(b.query))
      .slice(0, res.funded.length);
    expect(fundedSorted.map((q) => q.query)).toEqual(expected.map((q) => q.query));
  });

  it('produces a utilization report that allocates exactly the budget', () => {
    const res = runBudgetEngine(mission, queries);
    const report = buildUtilizationReport(res, queries.length);
    expect(report.allocated).toBe(queries.length);
    expect(report.unused).toBe(0);
    const missionReport = report.missions.find((m) => m.mission === mission)!;
    expect(missionReport.strategies.length).toBeGreaterThan(0);
  });

  it('is deterministic across runs', () => {
    const a = runBudgetEngine(mission, queries);
    const b = runBudgetEngine(mission, queries);
    expect(a.ranked.map((q) => q.query)).toEqual(b.ranked.map((q) => q.query));
    expect(a.ranked.map((q) => q.budgetScore)).toEqual(b.ranked.map((q) => q.budgetScore));
  });
});

describe('Strategy coverage', () => {
  it('exercises every configured strategy without overflow', () => {
    const allocated = allocateStrategies('STARTUP_INTERNSHIPS', 25);
    const total = allocated.reduce((s, x) => s + x.slots, 0);
    expect(total).toBe(25);
    const strategies = new Set<SearchStrategy>(allocated.map((s) => s.strategy));
    expect(strategies.size).toBe(allocated.length);
  });
});

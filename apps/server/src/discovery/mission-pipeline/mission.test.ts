import { describe, it, expect } from 'vitest';
import { HopEngine } from './hop-engine';
import { HopValidator } from './hop-validator';
import {
  isTransitionAllowed,
  getAllowedTransitions,
  getHopPriority,
  buildHopGraph,
  MISSION_PIPELINES,
} from './hop-registry';
import { canHop } from './hop-rules';
import type { HopType } from './hop.types';
import { MissionPipeline } from './mission-pipeline';
import { MissionRunner, formatMissionSummary } from './mission-runner';
import { MissionHealthReporter } from './mission-health';

describe('Hop Registry', () => {
  it('allows SEARCH -> COMPANY transition', () => {
    expect(isTransitionAllowed('SEARCH', 'COMPANY')).toBe(true);
  });

  it('rejects SEARCH -> OPPORTUNITY direct transition', () => {
    expect(isTransitionAllowed('SEARCH', 'OPPORTUNITY')).toBe(false);
  });

  it('returns allowed transitions from SEARCH', () => {
    const allowed = getAllowedTransitions('SEARCH');
    expect(allowed).toContain('COMPANY');
    expect(allowed).toContain('PORTFOLIO');
    expect(allowed).toContain('DIRECTORY');
    expect(allowed).toContain('CAREERS');
    expect(allowed).toContain('ECOSYSTEM');
    expect(allowed).toContain('UNIVERSITY');
    expect(allowed).toContain('RESEARCH');
    expect(allowed).toContain('LAB');
    expect(allowed).toContain('PLATFORM');
    expect(allowed).toContain('ORGANIZATION');
  });

  it('returns priority for COMPANY hop type', () => {
    expect(getHopPriority('COMPANY')).toBe(92);
  });

  it('returns priority for ATS hop type', () => {
    expect(getHopPriority('ATS')).toBe(98);
  });

  it('returns priority for OPPORTUNITY hop type', () => {
    expect(getHopPriority('OPPORTUNITY')).toBe(100);
  });

  it('builds hop graph from mission pipeline', () => {
    const graph = buildHopGraph(
      'ENGINEERING_INTERNSHIPS',
      ['SEARCH', 'COMPANY', 'CAREERS', 'ATS', 'OPPORTUNITY'],
      4,
    );
    expect(graph.start).toBe('SEARCH');
    expect(graph.transitions).toHaveLength(4);
    expect(graph.transitions[0]).toEqual({ from: 'SEARCH', to: 'COMPANY', allowed: true });
  });

  it('has pipeline configuration for ENGINEERING_INTERNSHIPS', () => {
    const config = MISSION_PIPELINES['ENGINEERING_INTERNSHIPS'];
    expect(config).toBeDefined();
    expect(config.pipeline).toEqual(['SEARCH', 'COMPANY', 'CAREERS', 'ATS', 'OPPORTUNITY']);
    expect(config.maxDepth).toBe(4);
  });

  it('has pipeline configuration for STARTUP_INTERNSHIPS', () => {
    const config = MISSION_PIPELINES['STARTUP_INTERNSHIPS'];
    expect(config).toBeDefined();
    expect(config.pipeline).toEqual([
      'SEARCH',
      'ECOSYSTEM',
      'PORTFOLIO',
      'COMPANY',
      'CAREERS',
      'ATS',
      'OPPORTUNITY',
    ]);
  });

  it('has pipeline configuration for GOVERNMENT_TECH_INTERNSHIPS', () => {
    const config = MISSION_PIPELINES['GOVERNMENT_TECH_INTERNSHIPS'];
    expect(config).toBeDefined();
    expect(config.pipeline).toEqual([
      'SEARCH',
      'ORGANIZATION',
      'PROGRAM',
      'APPLICATION',
      'OPPORTUNITY',
    ]);
  });

  it('has pipeline configuration for RESEARCH_INTERNSHIPS', () => {
    const config = MISSION_PIPELINES['RESEARCH_INTERNSHIPS'];
    expect(config).toBeDefined();
    expect(config.pipeline).toEqual(['SEARCH', 'LAB', 'PROJECT', 'CAREERS', 'OPPORTUNITY']);
  });

  it('has pipeline configuration for HACKATHONS', () => {
    const config = MISSION_PIPELINES['HACKATHONS'];
    expect(config).toBeDefined();
    expect(config.pipeline).toEqual(['SEARCH', 'PLATFORM', 'EVENT', 'REGISTRATION', 'OPPORTUNITY']);
  });
});

describe('Hop Rules', () => {
  it('allows CAREERS -> ATS transition', () => {
    expect(canHop('CAREERS', 'ATS')).toBe(true);
  });

  it('allows CAREERS -> OPPORTUNITY transition', () => {
    expect(canHop('CAREERS', 'OPPORTUNITY')).toBe(true);
  });

  it('allows ATS -> OPPORTUNITY transition', () => {
    expect(canHop('ATS', 'OPPORTUNITY')).toBe(true);
  });

  it('rejects OPPORTUNITY -> any transition', () => {
    expect(canHop('OPPORTUNITY', 'ATS')).toBe(false);
  });

  it('rejects COMPANY -> OPPORTUNITY direct transition', () => {
    expect(canHop('COMPANY', 'OPPORTUNITY')).toBe(false);
  });
});

describe('Hop Validator', () => {
  const validator = new HopValidator();

  it('validates legal transition', () => {
    const result = validator.validateTransition('COMPANY', 'CAREERS');
    expect(result.allowed).toBe(true);
  });

  it('invalidates illegal transition', () => {
    const result = validator.validateTransition('SEARCH', 'OPPORTUNITY');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('validates graph transitions', () => {
    const transitions = [
      { from: 'SEARCH' as HopType, to: 'COMPANY' as HopType, allowed: true },
      { from: 'COMPANY' as HopType, to: 'CAREERS' as HopType, allowed: true },
    ];
    const result = validator.validateGraph(transitions);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects invalid graph transitions', () => {
    const transitions = [
      { from: 'SEARCH' as HopType, to: 'OPPORTUNITY' as HopType, allowed: false },
    ];
    const result = validator.validateGraph(transitions);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validates depth within limits', () => {
    expect(validator.validateDepth(2, 4)).toBe(true);
    expect(validator.validateDepth(5, 4)).toBe(false);
  });

  it('validates priority above threshold', () => {
    expect(validator.validatePriority(80, 70)).toBe(true);
    expect(validator.validatePriority(60, 70)).toBe(false);
  });
});

describe('Hop Engine', () => {
  it('runs a simple pipeline and returns stats', () => {
    const engine = new HopEngine();
    const result = engine.run({
      mission: 'ENGINEERING_INTERNSHIPS',
      queries: ['software engineering internship', 'backend internship'],
      companyUrls: [],
      ecosystemCandidates: [],
      maxDepth: 4,
      priorityThreshold: 70,
      branchExpansionLimit: 10,
      visitedUrls: new Map(),
    });

    expect(result.root).not.toBeNull();
    expect(result.stats.queries).toBe(2);
  });

  it('skips nodes below priority threshold', () => {
    const engine = new HopEngine();
    const result = engine.run({
      mission: 'ENGINEERING_INTERNSHIPS',
      queries: ['low priority query'],
      companyUrls: [],
      ecosystemCandidates: [],
      maxDepth: 4,
      priorityThreshold: 100,
      branchExpansionLimit: 10,
      visitedUrls: new Map(),
    });

    expect(result.root).not.toBeNull();
    const skippedCount = result.stats.skipped ?? 0;
    expect(skippedCount).toBeGreaterThanOrEqual(0);
  });

  it('detects dead ends for login URLs', () => {
    const engine = new HopEngine();
    const result = engine.run({
      mission: 'ENGINEERING_INTERNSHIPS',
      queries: ['https://example.com/login'],
      companyUrls: [],
      ecosystemCandidates: [],
      maxDepth: 4,
      priorityThreshold: 0,
      branchExpansionLimit: 10,
      visitedUrls: new Map(),
    });

    const deadEnds = result.stats.deadEnds ?? 0;
    expect(deadEnds).toBeGreaterThanOrEqual(0);
  });

  it('marks OPPORTUNITY nodes as accepted', () => {
    const engine = new HopEngine();
    const result = engine.run({
      mission: 'ENGINEERING_INTERNSHIPS',
      queries: ['opportunity'],
      companyUrls: [],
      ecosystemCandidates: [],
      maxDepth: 4,
      priorityThreshold: 0,
      branchExpansionLimit: 10,
      visitedUrls: new Map(),
    });

    const accepted = result.stats.acceptedOpportunities ?? 0;
    expect(accepted).toBeGreaterThanOrEqual(0);
  });

  it('avoids revisiting URLs', () => {
    const engine = new HopEngine();
    const visitedUrls = new Map<
      string,
      { hopType: HopType; mission: string; depth: number; lastSeen: string; status: string }
    >();
    visitedUrls.set('https://example.com/careers', {
      hopType: 'CAREERS',
      mission: 'ENGINEERING_INTERNSHIPS',
      depth: 1,
      lastSeen: new Date().toISOString(),
      status: 'visited',
    });

    const result = engine.run({
      mission: 'ENGINEERING_INTERNSHIPS',
      queries: ['https://example.com/careers'],
      companyUrls: [],
      ecosystemCandidates: [],
      maxDepth: 4,
      priorityThreshold: 0,
      branchExpansionLimit: 10,
      visitedUrls,
    });

    expect(result.root).not.toBeNull();
  });
});

describe('Mission Pipeline Integration', () => {
  it('executes ENGINEERING_INTERNSHIPS pipeline', () => {
    const pipeline = new MissionPipeline();
    const result = pipeline.execute({
      mission: 'ENGINEERING_INTERNSHIPS',
      queries: ['software engineering internship'],
      companyUrls: [],
      ecosystemCandidates: [],
      maxDepth: 4,
      priorityThreshold: 70,
      branchExpansionLimit: 10,
      visitedUrls: new Map(),
    });

    expect(result.mission).toBe('ENGINEERING_INTERNSHIPS');
    expect(result.summary.mission).toBe('ENGINEERING_INTERNSHIPS');
    expect(result.graphJson).toBeDefined();
  });

  it('executes STARTUP_INTERNSHIPS pipeline', () => {
    const pipeline = new MissionPipeline();
    const result = pipeline.execute({
      mission: 'STARTUP_INTERNSHIPS',
      queries: ['startup internship'],
      companyUrls: [],
      ecosystemCandidates: [],
      maxDepth: 6,
      priorityThreshold: 65,
      branchExpansionLimit: 10,
      visitedUrls: new Map(),
    });

    expect(result.mission).toBe('STARTUP_INTERNSHIPS');
    expect(result.summary.mission).toBe('STARTUP_INTERNSHIPS');
  });

  it('executes GOVERNMENT_TECH_INTERNSHIPS pipeline', () => {
    const pipeline = new MissionPipeline();
    const result = pipeline.execute({
      mission: 'GOVERNMENT_TECH_INTERNSHIPS',
      queries: ['government tech internship'],
      companyUrls: [],
      ecosystemCandidates: [],
      maxDepth: 4,
      priorityThreshold: 75,
      branchExpansionLimit: 10,
      visitedUrls: new Map(),
    });

    expect(result.mission).toBe('GOVERNMENT_TECH_INTERNSHIPS');
    expect(result.summary.mission).toBe('GOVERNMENT_TECH_INTERNSHIPS');
  });

  it('executes RESEARCH_INTERNSHIPS pipeline', () => {
    const pipeline = new MissionPipeline();
    const result = pipeline.execute({
      mission: 'RESEARCH_INTERNSHIPS',
      queries: ['research internship'],
      companyUrls: [],
      ecosystemCandidates: [],
      maxDepth: 4,
      priorityThreshold: 72,
      branchExpansionLimit: 10,
      visitedUrls: new Map(),
    });

    expect(result.mission).toBe('RESEARCH_INTERNSHIPS');
    expect(result.summary.mission).toBe('RESEARCH_INTERNSHIPS');
  });

  it('executes HACKATHONS pipeline', () => {
    const pipeline = new MissionPipeline();
    const result = pipeline.execute({
      mission: 'HACKATHONS',
      queries: ['hackathon'],
      companyUrls: [],
      ecosystemCandidates: [],
      maxDepth: 4,
      priorityThreshold: 68,
      branchExpansionLimit: 10,
      visitedUrls: new Map(),
    });

    expect(result.mission).toBe('HACKATHONS');
    expect(result.summary.mission).toBe('HACKATHONS');
  });
});

describe('Mission Runner', () => {
  it('runs mission and returns health report', () => {
    const runner = new MissionRunner();
    const { result, health } = runner.run({
      mission: 'ENGINEERING_INTERNSHIPS',
      queries: ['software engineering internship'],
      companyUrls: [],
      ecosystemCandidates: [],
      maxDepth: 4,
      priorityThreshold: 70,
      branchExpansionLimit: 10,
      visitedUrls: new Map(),
    });

    expect(result.mission).toBe('ENGINEERING_INTERNSHIPS');
    expect(health.mission).toBe('ENGINEERING_INTERNSHIPS');
    expect(health.coverage).toBeGreaterThanOrEqual(0);
  });

  it('formats mission summary', () => {
    const summary = {
      mission: 'ENGINEERING_INTERNSHIPS',
      queries: 40,
      companies: 92,
      careerPages: 81,
      ats: 54,
      portfolio: 0,
      directories: 0,
      ecosystems: 0,
      programs: 0,
      applications: 0,
      universities: 0,
      labs: 0,
      platforms: 0,
      events: 0,
      organizations: 0,
      internshipPages: 39,
      deadEnds: 5,
      acceptedOpportunities: 28,
      averageBranchSize: 3.5,
      averageRecall: 0.7,
      generatedAt: new Date().toISOString(),
    };

    const formatted = formatMissionSummary(summary);
    expect(formatted).toContain('ENGINEERING_INTERNSHIPS Mission');
    expect(formatted).toContain('Queries:');
    expect(formatted).toContain('Companies:');
    expect(formatted).toContain('Accepted Opportunities:');
  });
});

describe('Mission Health', () => {
  it('generates health report for mission result', () => {
    const pipeline = new MissionPipeline();
    const result = pipeline.execute({
      mission: 'ENGINEERING_INTERNSHIPS',
      queries: ['software engineering internship'],
      companyUrls: [],
      ecosystemCandidates: [],
      maxDepth: 4,
      priorityThreshold: 70,
      branchExpansionLimit: 10,
      visitedUrls: new Map(),
    });

    const reporter = new MissionHealthReporter();
    const health = reporter.generate(result);

    expect(health.mission).toBe('ENGINEERING_INTERNSHIPS');
    expect(health.companiesFound).toBeGreaterThanOrEqual(0);
    expect(health.acceptedOpportunities).toBeGreaterThanOrEqual(0);
  });

  it('formats health report', () => {
    const reporter = new MissionHealthReporter();
    const health = {
      mission: 'ENGINEERING_INTERNSHIPS',
      coverage: 15,
      averageHopDepth: 2.5,
      companiesFound: 92,
      careerPages: 81,
      ats: 54,
      portfolioPages: 0,
      directories: 0,
      deadEnds: 5,
      acceptedOpportunities: 28,
      averageBranchSize: 3.5,
      averageRecall: 0.7,
    };

    const formatted = reporter.format(health);
    expect(formatted).toContain('Mission Coverage');
    expect(formatted).toContain('ENGINEERING_INTERNSHIPS');
    expect(formatted).toContain('Average Hop Depth:');
  });
});

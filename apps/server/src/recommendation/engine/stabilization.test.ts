import { describe, it, expect } from 'vitest';
import { CandidateSnapshotBuilder } from './candidate-snapshot';
import { RecommendationPortfolioBuilder } from './recommendation-portfolio';
import { ResponseValidator } from '../../modules/recommendation/ai/response-validator';
import { AI_TIMEOUT_MS } from '../../modules/recommendation/ai/ai.constants';

describe('Recommendation Engine V2: Stabilization & Production Readiness Verification', () => {
  const mockProfile = {
    fullName: 'Achyut Pandey',
    persona: 'COLLEGE_STUDENT',
    degree: 'B.Tech',
    branch: 'Computer Science',
    currentYear: 4,
    technicalSkills: ['React', 'Node.js', 'Express', 'MongoDB'],
    tools: ['Git'],
    preferredRoles: ['Full Stack Intern'],
    careerGoals: ['First Internship'],
    opportunityPreferences: { internships: true, hackathons: true },
  };

  const mockResume = {
    skills: ['React', 'Node.js', 'Express', 'MongoDB'],
    projects: [
      {
        title: 'Full Stack App',
        description: 'E-commerce app with React, Express, MongoDB',
        technologies: ['React', 'Express', 'MongoDB'],
      },
    ],
  };

  const snapshotBuilder = new CandidateSnapshotBuilder();
  const snapshot = snapshotBuilder.build(mockProfile, mockResume);
  const portfolioBuilder = new RecommendationPortfolioBuilder();

  it('1. should strictly guarantee no duplicate opportunities across portfolio slots', () => {
    const candidates = [
      {
        opportunity: {
          id: 'opp_1',
          title: 'Full Stack Intern',
          organization: 'Org A',
          skills: ['React', 'Node.js'],
        },
        totalScore: 95,
      },
      {
        opportunity: {
          id: 'opp_2',
          title: 'AI Engineering Intern',
          organization: 'Org B',
          skills: ['Python', 'LLM'],
        },
        totalScore: 90,
      },
      {
        opportunity: {
          id: 'opp_3',
          title: 'DevOps Cloud Intern',
          organization: 'Org C',
          skills: ['Docker', 'AWS'],
        },
        totalScore: 85,
      },
      {
        opportunity: {
          id: 'opp_4',
          title: 'Mobile App Intern',
          organization: 'Org D',
          skills: ['Flutter'],
        },
        totalScore: 80,
      },
      {
        opportunity: {
          id: 'opp_5',
          title: 'Research Fellow',
          organization: 'Org E',
          skills: ['C++'],
        },
        totalScore: 75,
      },
    ];

    const portfolio = portfolioBuilder.buildPortfolio(candidates, snapshot);
    const selectedIds = portfolio.selectedCandidates.map((c) => c.opportunity.id);

    expect(selectedIds).toHaveLength(5);
    const uniqueIds = new Set(selectedIds);
    expect(uniqueIds.size).toBe(5);
  });

  it('2. should defensively handle undefined organization or company fields without crashing', () => {
    const candidatesWithMissingFields = [
      {
        opportunity: {
          id: 'opp_10',
          title: 'Full Stack Intern',
          organization: undefined,
          company: undefined,
          skills: ['React'],
        },
        totalScore: 90,
      },
      {
        opportunity: {
          id: 'opp_11',
          title: 'Backend Intern',
          organization: null,
          skills: ['Node.js'],
        },
        totalScore: 85,
      },
    ];

    expect(() =>
      portfolioBuilder.buildPortfolio(candidatesWithMissingFields, snapshot),
    ).not.toThrow();
    const portfolio = portfolioBuilder.buildPortfolio(candidatesWithMissingFields, snapshot);
    expect(portfolio.selectedCandidates.length).toBeGreaterThan(0);
  });

  it('3. should correctly report non-zero unique technologies in portfolio diversity metrics', () => {
    const candidates = [
      {
        opportunity: {
          id: 'opp_20',
          title: 'Full Stack Intern',
          organization: 'Org A',
          skills: ['React', 'Node.js', 'MongoDB'],
        },
        totalScore: 90,
      },
      {
        opportunity: {
          id: 'opp_21',
          title: 'Cloud Intern',
          organization: 'Org B',
          skills: ['AWS', 'Docker', 'Kubernetes'],
        },
        totalScore: 85,
      },
    ];

    const portfolio = portfolioBuilder.buildPortfolio(candidates, snapshot);
    expect(portfolio.uniqueTechnologiesCount).toBeGreaterThan(0);
    expect(portfolio.portfolioDiversityScore).toBeGreaterThan(0);
  });

  it('4. should output exactly 5 selected opportunities for LLM personalization', () => {
    const candidates = Array.from({ length: 20 }, (_, i) => ({
      opportunity: {
        id: `opp_${i}`,
        title: `Role ${i}`,
        organization: `Org ${i}`,
        skills: [`Skill_${i}`],
      },
      totalScore: 95 - i,
    }));

    const portfolio = portfolioBuilder.buildPortfolio(candidates, snapshot);
    expect(portfolio.selectedCandidates).toHaveLength(5);
  });

  it('5. should sanitize and truncate over-length LLM outputs smoothly before Zod schema validation', () => {
    const overLengthJson = JSON.stringify({
      todayMission: 'A'.repeat(300), // exceeds 120 chars
      aiSummary: 'B'.repeat(1000), // exceeds 500 chars
      recommendationsBySlot: {
        perfectMatch: {
          personalizedReason: 'C'.repeat(500), // exceeds 300 chars
          missingSkills: ['D'.repeat(200), 'E'.repeat(200)],
          firstAction: 'F'.repeat(300), // exceeds 150 chars
          confidenceMessage: 'G'.repeat(300), // exceeds 150 chars
        },
      },
    });

    expect(() => ResponseValidator.validate(overLengthJson)).not.toThrow();
    const validated = ResponseValidator.validate(overLengthJson);
    expect(validated.todayMission.length).toBeLessThanOrEqual(120);
    expect(validated.aiSummary.length).toBeLessThanOrEqual(600);
    expect(
      validated.recommendationsBySlot['perfectMatch'].personalizedReason.length,
    ).toBeLessThanOrEqual(250);
  });

  it('6. should configure provider timeout to 20 seconds (20000ms)', () => {
    expect(AI_TIMEOUT_MS).toBe(20000);
  });
});

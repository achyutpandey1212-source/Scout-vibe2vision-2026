import { describe, it, expect, beforeEach } from 'vitest';
import { CandidateSnapshotBuilder } from './candidate-snapshot';
import { OpportunityFilter } from './opportunity-filter';
import { RecommendationScorer } from './recommendation-score';

describe('Recommendation Engine V2 Stage 2: Filtering & Scoring', () => {
  let builder: CandidateSnapshotBuilder;
  let filter: OpportunityFilter;
  let scorer: RecommendationScorer;

  beforeEach(() => {
    builder = new CandidateSnapshotBuilder();
    filter = new OpportunityFilter();
    scorer = new RecommendationScorer();
  });

  const mockProfile = {
    persona: 'COLLEGE_STUDENT',
    degree: 'B.Tech',
    branch: 'Computer Science',
    currentYear: 3,
    technicalSkills: ['React.js', 'NodeJS', 'TypeScript', 'Mongo DB', 'Express.js'],
    tools: ['Git', 'GitHub', 'Docker'],
    preferredRoles: ['Full Stack Intern', 'Backend Intern'],
    careerGoals: ['First Internship'],
    opportunityPreferences: {
      internships: true,
      hackathons: true,
    },
  };

  const mockResume = {
    skills: ['LangGraph', 'Gemini', 'Redis', 'React', 'NodeJS'],
    projects: [
      {
        title: 'Scout AI Agent Platform',
        description: 'Built an AI platform using LangGraph, Gemini and Node.js',
        technologies: ['LangGraph', 'Gemini', 'TypeScript'],
      },
      {
        title: 'E-Commerce Backend',
        description: 'Backend system built with Express and MongoDB',
        technologies: ['Express', 'MongoDB', 'NodeJS'],
      },
    ],
  };

  it('should hard reject Master programs, PhD, Senior roles, and expired postings', () => {
    const snapshot = builder.build(mockProfile, mockResume);

    const rawOpportunities = [
      {
        id: '1',
        title: 'Master of Science in Computer Science',
        description: 'Graduate degree program at Stanford',
        opportunityType: 'OTHER',
      },
      {
        id: '2',
        title: 'Postdoctoral Research Fellow in AI',
        description: 'PhD required for research lab',
        opportunityType: 'OTHER',
      },
      {
        id: '3',
        title: 'Senior Staff Software Engineer',
        description: 'Requires 10+ years experience leading teams',
        opportunityType: 'FULL_TIME',
        experienceLevel: '10+ years',
      },
      {
        id: '4',
        title: 'Software Engineer Intern',
        description: 'Expired internship posting from last year',
        opportunityType: 'INTERNSHIP',
        status: 'EXPIRED',
      },
      {
        id: '5',
        title: 'Software Engineering Intern',
        description: 'Entry level 6-month internship working on React and Node.js APIs',
        opportunityType: 'INTERNSHIP',
        skills: ['React', 'Node.js', 'MongoDB'],
      },
    ];

    const result = filter.filter(snapshot, rawOpportunities);

    expect(result.eligible).toHaveLength(1);
    expect(result.eligible[0].id).toBe('5');
    expect(result.stats.rejectedCount).toBe(4);
    expect(result.stats.rejectionReasons['REJECT_MASTER_PROGRAM']).toBe(1);
    expect(result.stats.rejectionReasons['REJECT_PHD']).toBe(1);
    expect(result.stats.rejectionReasons['REJECT_SENIOR_ROLE']).toBe(1);
    expect(result.stats.rejectionReasons['REJECT_EXPIRED']).toBe(1);
  });

  it('should score candidates higher when project themes match opportunity domains', () => {
    const snapshot = builder.build(mockProfile, mockResume);

    const aiOpportunity = {
      title: 'AI Platform Engineering Intern',
      description: 'Work on LLM applications using Gemini, LangGraph, and TypeScript',
      opportunityType: 'INTERNSHIP',
      skills: ['LangGraph', 'Gemini', 'TypeScript'],
      remote: true,
    };

    const genericOpportunity = {
      title: 'General Support Developer Intern',
      description: 'Basic maintenance tasks',
      opportunityType: 'INTERNSHIP',
      skills: ['HTML'],
      remote: false,
    };

    const aiScored = scorer.score(snapshot, aiOpportunity);
    const genericScored = scorer.score(snapshot, genericOpportunity);

    expect(aiScored).not.toBeNull();
    expect(aiScored?.totalScore).toBeGreaterThanOrEqual(75);
    expect(aiScored?.matchedProjects).toContain('Scout AI Agent Platform');
    expect(aiScored?.recommendationStrength).toMatch(/excellent|strong/);

    // Generic opportunity should have low score or be filtered out by min threshold (< 45)
    if (genericScored) {
      expect(genericScored.totalScore).toBeLessThan(aiScored!.totalScore);
    }
  });

  it('should apply soft penalties for non-remote, missing deadline, and unpaid postings without hard rejecting them', () => {
    const snapshot = builder.build(mockProfile, mockResume);

    const oppWithPenalties = {
      title: 'Backend Software Intern',
      description: 'Work on Express and Node.js microservices',
      opportunityType: 'INTERNSHIP',
      skills: ['Express', 'Node.js'],
      remote: false,
      deadline: null,
      fundingType: 'UNPAID',
    };

    const scored = scorer.score(snapshot, oppWithPenalties);
    expect(scored).not.toBeNull();
    expect(scored?.scoreBreakdown.softPenalties).toBeGreaterThan(0);
  });

  it('should sort opportunities descending by totalScore and assign recommendation strengths', () => {
    const snapshot = builder.build(mockProfile, mockResume);

    const oppList = [
      {
        title: 'AI & Full Stack Engineer Intern',
        description: 'LangGraph, Gemini, Express, React, TypeScript',
        opportunityType: 'INTERNSHIP',
        skills: ['React', 'Express', 'LangGraph', 'Gemini'],
        remote: true,
      },
      {
        title: 'Backend Node.js Intern',
        description: 'Express and MongoDB REST services',
        opportunityType: 'INTERNSHIP',
        skills: ['Express', 'MongoDB'],
        remote: true,
      },
    ];

    const scoredList = oppList
      .map((opp) => scorer.score(snapshot, opp))
      .filter((res): res is NonNullable<typeof res> => res !== null)
      .sort((a, b) => b.totalScore - a.totalScore);

    expect(scoredList.length).toBeGreaterThan(0);
    expect(scoredList[0].totalScore).toBeGreaterThanOrEqual(scoredList[1].totalScore);
    expect(['excellent', 'strong']).toContain(scoredList[0].recommendationStrength);
  });
});

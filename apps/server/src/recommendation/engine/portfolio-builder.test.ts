import { describe, it, expect } from 'vitest';
import { CandidateSnapshotBuilder } from './candidate-snapshot';
import { RecommendationPortfolioBuilder } from './recommendation-portfolio';

describe('Recommendation Engine V2 Stage 4: Recommendation Diversity & Portfolio Construction', () => {
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

  it('should build a 5-slot recommendation portfolio with high diversity across companies and role families', () => {
    const mockRanked = [
      {
        opportunity: {
          id: '1',
          title: 'Senior Full Stack Software Intern',
          organization: 'Stripe',
          opportunityType: 'INTERNSHIP',
          skills: ['React', 'Node.js', 'Express'],
          applyUrl: 'https://stripe.com/jobs/1',
        },
        totalScore: 92,
      },
      {
        opportunity: {
          id: '2',
          title: 'AI & LLM Platform Intern',
          organization: 'OpenAI',
          opportunityType: 'INTERNSHIP',
          skills: ['Python', 'LangGraph', 'Gemini'],
          description: 'Seed startup building LLM workflows',
        },
        totalScore: 88,
      },
      {
        opportunity: {
          id: '3',
          title: 'Cloud Systems & DevOps Engineer',
          organization: 'AWS',
          opportunityType: 'INTERNSHIP',
          skills: ['Docker', 'Kubernetes', 'AWS'],
          applyUrl: 'https://aws.amazon.com/jobs/3',
        },
        totalScore: 84,
      },
      {
        opportunity: {
          id: '4',
          title: 'Mobile App Developer Intern',
          organization: 'Uber',
          opportunityType: 'INTERNSHIP',
          skills: ['React Native', 'Flutter'],
          applyUrl: 'https://uber.com/jobs/4',
        },
        totalScore: 81,
      },
      {
        opportunity: {
          id: '5',
          title: 'Research Fellow in Quantum Computing',
          organization: 'MIT Research Lab',
          opportunityType: 'FELLOWSHIP',
          skills: ['Python', 'Qiskit'],
        },
        totalScore: 78,
      },
    ];

    const portfolio = portfolioBuilder.buildPortfolio(mockRanked, snapshot);

    expect(portfolio.selectedCandidates).toHaveLength(5);
    expect(portfolio.slots['perfectMatch']).toBeDefined();
    expect(portfolio.slots['hiddenGem']).toBeDefined();
    expect(portfolio.slots['fastApply']).toBeDefined();
    expect(portfolio.slots['resumeBuilder']).toBeDefined();
    expect(portfolio.slots['stretchGoal']).toBeDefined();

    expect(portfolio.uniqueCompaniesCount).toBe(5);
    expect(portfolio.uniqueRoleFamiliesCount).toBeGreaterThanOrEqual(4);
    expect(portfolio.portfolioDiversityScore).toBeGreaterThanOrEqual(75);
  });

  it('should gracefully handle small/homogenous pools without crashing or dropping slots', () => {
    const homogenousRanked = [
      {
        opportunity: {
          id: '10',
          title: 'Backend Node.js Developer Intern',
          organization: 'TechCorp',
          opportunityType: 'INTERNSHIP',
          skills: ['Express', 'Node.js'],
        },
        totalScore: 85,
      },
      {
        opportunity: {
          id: '11',
          title: 'Backend API Developer Intern',
          organization: 'TechCorp',
          opportunityType: 'INTERNSHIP',
          skills: ['Express', 'MongoDB'],
        },
        totalScore: 82,
      },
    ];

    const portfolio = portfolioBuilder.buildPortfolio(homogenousRanked, snapshot);

    expect(portfolio.selectedCandidates).toHaveLength(2);
    expect(portfolio.slots['perfectMatch']).toBeDefined();
    expect(portfolio.portfolioDiversityScore).toBeGreaterThan(0);
  });

  it('should select Resume Builder slot that fills candidate technical skill gaps', () => {
    const mockRanked = [
      {
        opportunity: {
          id: '20',
          title: 'Full Stack Engineer Intern',
          organization: 'CompanyA',
          skills: ['React', 'Express'],
        },
        totalScore: 90,
      },
      {
        opportunity: {
          id: '21',
          title: 'General Support Developer',
          organization: 'CompanyB',
          skills: ['React', 'MongoDB'],
        },
        totalScore: 88,
      },
      {
        opportunity: {
          id: '22',
          title: 'Easy Apply React Helper',
          organization: 'CompanyC',
          skills: ['React'],
          applyUrl: 'https://companyc.com/apply',
        },
        totalScore: 86,
      },
      {
        opportunity: {
          id: '23',
          title: 'DevOps & Infrastructure Intern',
          organization: 'CompanyD',
          skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform'],
        },
        totalScore: 85,
      },
    ];

    const portfolio = portfolioBuilder.buildPortfolio(mockRanked, snapshot);
    const resumeBuilderCand = portfolio.slots['resumeBuilder']?.candidate;

    expect(resumeBuilderCand).toBeDefined();
    const oppSkills = resumeBuilderCand.opportunity.skills;
    expect(
      oppSkills.some((s: string) =>
        ['kubernetes', 'docker', 'aws', 'terraform'].includes(s.toLowerCase()),
      ),
    ).toBe(true);
  });
});

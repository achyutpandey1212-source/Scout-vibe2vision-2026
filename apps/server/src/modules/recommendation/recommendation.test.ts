import { describe, it, expect, beforeEach } from 'vitest';
import { RecommendationTriggerService } from './triggers/recommendation-trigger.service';
import { ProfileHashGenerator } from './hash/profile-hash.generator';
import { IRecommendationPack } from './types/recommendation.types';
import { RECOMMENDATION_VERSION } from './constants';
import { HardFilterEngine } from './engine/hard-filter.engine';
import { ScoringEngine } from './engine/scoring.engine';
import { DiversificationEngine } from './engine/diversification.engine';
import { IOpportunity } from '../../discovery/extraction/models/opportunity.model';
import { IProfile } from '../../profile/models/profile.model';
import mongoose from 'mongoose';

describe('Recommendation Module Unit Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId();

  const mockProfile = {
    userId: mockUserId,
    gender: 'FEMALE' as const,
    degree: 'B.Tech',
    branch: 'Computer Science',
    currentYear: 3,
    expectedGraduation: 2027,
    cgpa: 8.5,
    technicalSkills: ['React', 'Node.js'],
    softSkills: ['Communication'],
    tools: ['Git'],
    languages: ['English'],
    interestDomains: ['Software Engineering'],
    preferredRoles: ['Frontend Developer'],
    careerGoals: ['Land a startup internship'],
    opportunityPreferences: { internships: true },
    persona: 'COLLEGE_STUDENT' as const,
    careerReadinessScore: 75,
    availability: { hoursPerWeek: 20 },
    remotePreference: true,
  } as unknown as IProfile;

  const mockResume = {
    skills: ['React', 'TypeScript'],
    certifications: ['AWS Cloud Practitioner'],
    achievements: ['Hackathon Winner'],
    education: [{ degree: 'B.Tech', fieldOfStudy: 'Computer Science', cgpa: 8.5 }],
    experience: [{ role: 'Web Intern', description: 'Built frontend features' }],
    projects: [
      {
        title: 'Portfolio',
        description: 'Personal portfolio website',
        technologies: ['HTML', 'CSS'],
      },
    ],
  };

  describe('ProfileHashGenerator', () => {
    it('should generate a deterministic hash (same inputs = same hash)', () => {
      const hash1 = ProfileHashGenerator.generate(mockProfile, mockResume, RECOMMENDATION_VERSION);
      const hash2 = ProfileHashGenerator.generate(mockProfile, mockResume, RECOMMENDATION_VERSION);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });
  });

  describe('RecommendationTriggerService', () => {
    let currentHash: string;

    beforeEach(() => {
      currentHash = ProfileHashGenerator.generate(mockProfile, mockResume, RECOMMENDATION_VERSION);
    });

    it('should generate if no pack exists', () => {
      const result = RecommendationTriggerService.shouldGenerateRecommendation(null, currentHash);
      expect(result.shouldGenerate).toBe(true);
      expect(result.reason).toBe('LOGIN');
    });
  });

  describe('Scoring and Diversification Engine (Phase 3)', () => {
    const makeMockOp = (fields: Partial<IOpportunity>): IOpportunity => {
      return {
        _id: new mongoose.Types.ObjectId(),
        title: 'Mock Op',
        description: 'Mock Description',
        summary: 'Mock Summary',
        organization: 'Mock Org',
        opportunityType: 'INTERNSHIP',
        category: 'Design',
        applicationUrl: 'https://example.com/' + Math.random(),
        sourceURL: 'https://example.com/' + Math.random(),
        sourceDomain: 'example.com',
        sourceType: 'OTHER',
        confidence: 90,
        hash: 'mock-hash-' + Math.random(),
        status: 'ACTIVE',
        visibility: 'PUBLIC',
        archived: false,
        eligibleBranches: [],
        eligibleYears: [],
        minimumEducation: '',
        womenFocused: false,
        visaSponsored: false,
        tags: [],
        skills: [],
        ...fields,
      } as unknown as IOpportunity;
    };

    it('should calculate reproducible and deterministic scores (same input = same score)', () => {
      const op = makeMockOp({ title: 'Frontend Developer React', tags: ['React', 'Design'] });
      const score1 = ScoringEngine.scoreOpportunity(op, mockProfile);
      const score2 = ScoringEngine.scoreOpportunity(op, mockProfile);
      expect(score1.finalScore).toBe(score2.finalScore);
      expect(score1.scoreBreakdown).toEqual(score2.scoreBreakdown);
    });

    it('should increase score for branch matches and interest overlaps', () => {
      const opLowMatch = makeMockOp({
        title: 'System Analyst',
        eligibleBranches: ['Mechanical Engineering'],
      });
      const opHighMatch = makeMockOp({
        title: 'Software Developer',
        eligibleBranches: ['Computer Science'],
        tags: ['React', 'Software Engineering'],
      });

      const resLow = ScoringEngine.scoreOpportunity(opLowMatch, mockProfile);
      const resHigh = ScoringEngine.scoreOpportunity(opHighMatch, mockProfile);

      expect(resHigh.finalScore).toBeGreaterThan(resLow.finalScore);
      expect(resHigh.scoreBreakdown.baseMatch).toBeGreaterThan(resLow.scoreBreakdown.baseMatch);
      expect(resHigh.scoreBreakdown.interest).toBeGreaterThan(resLow.scoreBreakdown.interest);
    });

    it('should apply women-centric bonus for female users', () => {
      const opGeneral = makeMockOp({ title: 'Standard Fellowship', womenFocused: false });
      const opWomen = makeMockOp({ title: 'Women in Tech Fellowship', womenFocused: true });

      const scoreGen = ScoringEngine.scoreOpportunity(opGeneral, mockProfile);
      const scoreWomen = ScoringEngine.scoreOpportunity(opWomen, mockProfile);

      expect(scoreWomen.scoreBreakdown.womenBonus).toBe(5);
      expect(scoreGen.scoreBreakdown.womenBonus).toBe(0);
    });

    it('should score portfolio builders and hidden gems higher', () => {
      const opStandard = makeMockOp({ hiddenGemScore: 0 });
      const opPremium = makeMockOp({
        hiddenGemScore: 90,
        careerValPortfolio: 5,
        careerValResume: 5,
        careerValLearning: 5,
      });

      const resStandard = ScoringEngine.scoreOpportunity(opStandard, mockProfile);
      const resPremium = ScoringEngine.scoreOpportunity(opPremium, mockProfile);

      expect(resPremium.scoreBreakdown.portfolio).toBeGreaterThan(
        resStandard.scoreBreakdown.portfolio,
      );
      expect(resPremium.scoreBreakdown.hiddenGem).toBe(5);
    });

    it('should respect remote work preference', () => {
      const opOnsite = makeMockOp({ remote: false });
      const opRemote = makeMockOp({ remote: true });

      const resOnsite = ScoringEngine.scoreOpportunity(opOnsite, mockProfile);
      const resRemote = ScoringEngine.scoreOpportunity(opRemote, mockProfile);

      expect(resRemote.scoreBreakdown.remote).toBe(5);
      expect(resOnsite.scoreBreakdown.remote).toBe(3);
    });

    it('should stably sort tie scores using trust, quality, then date', () => {
      const now = new Date();
      const op1 = makeMockOp({ trustScore: 60, qualityScore: 80, createdAt: now as any });
      const op2 = makeMockOp({ trustScore: 90, qualityScore: 80, createdAt: now as any });
      const op3 = makeMockOp({ trustScore: 90, qualityScore: 95, createdAt: now as any });

      // Trigger run to score and sort
      const ranked = ScoringEngine.run([op1, op2, op3], mockProfile);

      expect(ranked[0].opportunity._id.toString()).toBe(op3._id.toString()); // Highest quality (95) among highest trust (90)
      expect(ranked[1].opportunity._id.toString()).toBe(op2._id.toString()); // Next highest trust (90)
      expect(ranked[2].opportunity._id.toString()).toBe(op1._id.toString()); // Lowest trust (60)
    });

    it('should select diversified candidates from ranked pool without mutating original scores', () => {
      // Create candidates from same organization/category to test diversification
      const op1 = makeMockOp({ organization: 'Razorpay', category: 'INTERNSHIPS' as any });
      const op2 = makeMockOp({ organization: 'Razorpay', category: 'INTERNSIPS' as any }); // should be penalized during selection
      const op3 = makeMockOp({ organization: 'Google', category: 'FELLOWSHIPS' as any }); // different org & type, should be prioritized over op2
      const op4 = makeMockOp({ organization: 'Microsoft', category: 'JOBS' as any });

      const ranked = ScoringEngine.run([op1, op2, op3, op4], mockProfile);
      ranked[0].finalScore = 95;
      ranked[1].finalScore = 94;
      ranked[2].finalScore = 90;
      ranked[3].finalScore = 85;
      const originalScores = ranked.map((c) => c.finalScore);

      const diversified = DiversificationEngine.diversify(ranked, 3);

      // Verify the selection prioritized op3 over op2 due to same organization penalty
      expect(diversified[0].opportunity.organization).toBe('Razorpay');
      expect(diversified[1].opportunity.organization).toBe('Google'); // op3 is selected 2nd

      // Verify scores are not mutated
      diversified.forEach((cand) => {
        const match = ranked.find(
          (r) => r.opportunity._id.toString() === cand.opportunity._id.toString(),
        );
        expect(cand.finalScore).toBe(match?.finalScore);
      });
    });
  });
});

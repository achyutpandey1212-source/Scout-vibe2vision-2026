import { describe, it, expect, beforeEach } from 'vitest';
import { RecommendationTriggerService } from './triggers/recommendation-trigger.service';
import { ProfileHashGenerator } from './hash/profile-hash.generator';
import { IRecommendationPack } from './types/recommendation.types';
import { RECOMMENDATION_VERSION } from './constants';
import { HardFilterEngine } from './engine/hard-filter.engine';
import { IOpportunity } from '../../discovery/extraction/models/opportunity.model';
import { IProfile } from '../../profile/models/profile.model';
import mongoose from 'mongoose';

describe('Recommendation Module Phase 1 & 2 Tests', () => {
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

    it('should change hash when onboarding changes', () => {
      const hash1 = ProfileHashGenerator.generate(mockProfile, mockResume, RECOMMENDATION_VERSION);
      const updatedProfile = { ...mockProfile, branch: 'Information Technology' };
      const hash2 = ProfileHashGenerator.generate(
        updatedProfile,
        mockResume,
        RECOMMENDATION_VERSION,
      );
      expect(hash1).not.toBe(hash2);
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

    it('should NOT generate if a fresh ready pack exists with matching hash and version', () => {
      const mockPack = {
        userId: mockUserId,
        status: 'READY',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12),
        profileHash: currentHash,
        recommendationVersion: RECOMMENDATION_VERSION,
      } as IRecommendationPack;

      const result = RecommendationTriggerService.shouldGenerateRecommendation(
        mockPack,
        currentHash,
      );
      expect(result.shouldGenerate).toBe(false);
    });
  });

  describe('HardFilterEngine and Candidate Pooling', () => {
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
        ...fields,
      } as unknown as IOpportunity;
    };

    it('should filter out expired opportunities', () => {
      const expiredOp1 = makeMockOp({ deadlineStatus: 'EXPIRED' });
      const expiredOp2 = makeMockOp({ intelligence: { expired: true } as any });
      const expiredOp3 = makeMockOp({ deadline: new Date(Date.now() - 1000 * 60).toISOString() }); // 1 min ago
      const activeOp = makeMockOp({
        deadline: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      }); // 1 hour later

      const candidates = [expiredOp1, expiredOp2, expiredOp3, activeOp];
      const { pool } = HardFilterEngine.run(candidates, mockProfile);

      expect(pool).toHaveLength(1);
      expect(pool[0].opportunity._id.toString()).toBe(activeOp._id.toString());
    });

    it('should filter out US-only citizenship restrictions for Indian users', () => {
      const usOnlyOp = makeMockOp({ description: 'This program is open to US Citizens Only.' });
      const globalOp = makeMockOp({ description: 'Open to everyone globally.' });

      const candidates = [usOnlyOp, globalOp];
      const { pool } = HardFilterEngine.run(candidates, mockProfile);

      expect(pool).toHaveLength(1);
      expect(pool[0].opportunity._id.toString()).toBe(globalOp._id.toString());
    });

    it('should filter out visa authorization requirements if not sponsored', () => {
      const visaRequiredOp = makeMockOp({
        description: 'Requires UK Work Authorization to apply.',
        visaSponsored: false,
      });
      const visaSponsoredOp = makeMockOp({
        description: 'Requires UK Work Authorization but visa is sponsored.',
        visaSponsored: true,
      });

      const candidates = [visaRequiredOp, visaSponsoredOp];
      const { pool } = HardFilterEngine.run(candidates, mockProfile);

      expect(pool).toHaveLength(1);
      expect(pool[0].opportunity._id.toString()).toBe(visaSponsoredOp._id.toString());
    });

    it('should check branch synonym matching and filter mismatching branches', () => {
      const matchingOp = makeMockOp({ eligibleBranches: ['CSE', 'Information Technology'] });
      const mismatchingOp = makeMockOp({ eligibleBranches: ['Mechanical Engineering'] });

      const candidates = [matchingOp, mismatchingOp];
      const { pool } = HardFilterEngine.run(candidates, mockProfile);

      expect(pool).toHaveLength(1);
      expect(pool[0].opportunity._id.toString()).toBe(matchingOp._id.toString());
    });

    it('should filter year eligibility mismatch', () => {
      const matchingOp = makeMockOp({ suitableThirdYear: true, eligibleYears: ['3rd'] });
      const mismatchingOp = makeMockOp({ suitableThirdYear: false, eligibleYears: ['4th'] });

      const candidates = [matchingOp, mismatchingOp];
      const { pool } = HardFilterEngine.run(candidates, mockProfile);

      expect(pool).toHaveLength(1);
      expect(pool[0].opportunity._id.toString()).toBe(matchingOp._id.toString());
    });

    it('should filter masters-only minimum qualification for undergraduate', () => {
      const mastersOp = makeMockOp({ minimumEducation: 'Masters degree or PhD required' });
      const undergradOp = makeMockOp({ minimumEducation: 'B.Tech or equivalent' });

      const candidates = [mastersOp, undergradOp];
      const { pool } = HardFilterEngine.run(candidates, mockProfile);

      expect(pool).toHaveLength(1);
      expect(pool[0].opportunity._id.toString()).toBe(undergradOp._id.toString());
    });

    it('should allow unknown eligibility values and rolling/no deadline', () => {
      const rollingOp = makeMockOp({ deadlineStatus: 'ROLLING' });
      const noDeadlineOp = makeMockOp({ deadline: null });
      const unknownGenderOp = makeMockOp({ genderEligibility: null });

      const candidates = [rollingOp, noDeadlineOp, unknownGenderOp];
      const { pool } = HardFilterEngine.run(candidates, mockProfile);

      expect(pool).toHaveLength(3);
    });

    it('should create detailed filter stage report counts and percentages', () => {
      const op1 = makeMockOp({ deadlineStatus: 'EXPIRED' });
      const op2 = makeMockOp({ description: 'US Citizens Only.' });
      const op3 = makeMockOp({ eligibleBranches: ['Mechanical Engineering'] });
      const op4 = makeMockOp({ title: 'Eligible Software Role', eligibleBranches: ['CSE'] });

      const candidates = [op1, op2, op3, op4];
      const { report } = HardFilterEngine.run(candidates, mockProfile);

      expect(report.initialCount).toBe(4);
      expect(report.finalCount).toBe(1);
      expect(report.rejectedCandidates).toHaveLength(3);

      // Check specific rejection reasons
      const rejectedOpTitles = report.rejectedCandidates.map((c) => c.title);
      expect(rejectedOpTitles).toContain(op1.title);
      expect(rejectedOpTitles).toContain(op2.title);
      expect(rejectedOpTitles).toContain(op3.title);

      // Check percentage calculation in stages
      const deadlineStage = report.stages.find((s) => s.stage === 'Deadline Filter');
      expect(deadlineStage?.removedCount).toBe(1);
      expect(deadlineStage?.removedPercentage).toBe(25); // 1 out of 4 removed = 25%
    });
  });
});

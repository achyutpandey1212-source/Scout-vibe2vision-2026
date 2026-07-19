import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecommendationTriggerService } from './triggers/recommendation-trigger.service';
import { ProfileHashGenerator } from './hash/profile-hash.generator';
import { IRecommendationPack } from './types/recommendation.types';
import { RECOMMENDATION_VERSION } from './constants';
import mongoose from 'mongoose';

describe('Recommendation Module Phase 1 Tests', () => {
  const mockUserId = new mongoose.Types.ObjectId();

  const mockProfile = {
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
  };

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
      expect(hash1).toHaveLength(64); // SHA-256 is 64 chars hex
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

    it('should change hash when resume changes', () => {
      const hash1 = ProfileHashGenerator.generate(mockProfile, mockResume, RECOMMENDATION_VERSION);
      const updatedResume = { ...mockResume, skills: ['React', 'TypeScript', 'Docker'] };
      const hash2 = ProfileHashGenerator.generate(
        mockProfile,
        updatedResume,
        RECOMMENDATION_VERSION,
      );
      expect(hash1).not.toBe(hash2);
    });

    it('should ignore non-meaningful changes like timestamps or id properties', () => {
      const profileWithMetadata = {
        ...mockProfile,
        _id: 'some-random-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const hash1 = ProfileHashGenerator.generate(mockProfile, mockResume, RECOMMENDATION_VERSION);
      const hash2 = ProfileHashGenerator.generate(
        profileWithMetadata,
        mockResume,
        RECOMMENDATION_VERSION,
      );
      expect(hash1).toBe(hash2);
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
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12), // 12 hours from now
        profileHash: currentHash,
        recommendationVersion: RECOMMENDATION_VERSION,
      } as IRecommendationPack;

      const result = RecommendationTriggerService.shouldGenerateRecommendation(
        mockPack,
        currentHash,
      );
      expect(result.shouldGenerate).toBe(false);
    });

    it('should generate if pack is expired', () => {
      const mockPack = {
        userId: mockUserId,
        status: 'READY',
        expiresAt: new Date(Date.now() - 1000 * 60 * 60), // expired 1 hour ago
        profileHash: currentHash,
        recommendationVersion: RECOMMENDATION_VERSION,
      } as IRecommendationPack;

      const result = RecommendationTriggerService.shouldGenerateRecommendation(
        mockPack,
        currentHash,
      );
      expect(result.shouldGenerate).toBe(true);
      expect(result.reason).toBe('CACHE_EXPIRED');
    });

    it('should generate if profile hash changed', () => {
      const mockPack = {
        userId: mockUserId,
        status: 'READY',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12),
        profileHash: 'old-different-hash',
        recommendationVersion: RECOMMENDATION_VERSION,
      } as IRecommendationPack;

      const result = RecommendationTriggerService.shouldGenerateRecommendation(
        mockPack,
        currentHash,
      );
      expect(result.shouldGenerate).toBe(true);
      expect(result.reason).toBe('PROFILE_UPDATED');
    });

    it('should generate if version mismatch', () => {
      const mockPack = {
        userId: mockUserId,
        status: 'READY',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12),
        profileHash: currentHash,
        recommendationVersion: 'RE-v0-old-version',
      } as IRecommendationPack;

      const result = RecommendationTriggerService.shouldGenerateRecommendation(
        mockPack,
        currentHash,
      );
      expect(result.shouldGenerate).toBe(true);
      expect(result.reason).toBe('VERSION_CHANGED');
    });
  });
});

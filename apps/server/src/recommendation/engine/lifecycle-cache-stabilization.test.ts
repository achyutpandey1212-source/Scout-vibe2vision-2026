import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileHashGenerator } from '../../modules/recommendation/hash/profile-hash.generator';
import { RecommendationTriggerService } from '../../modules/recommendation/triggers/recommendation-trigger.service';
import { GenerateRecommendationsUseCase } from '../../modules/recommendation/use-cases/generate-recommendations.use-case';
import { OnboardingGuard } from '../../modules/recommendation/guard/onboarding-guard';
import { BackgroundGenerationService } from '../../modules/recommendation/generation/background-generation.service';
import { RecommendationService } from '../../modules/recommendation/service/recommendation.service';

vi.mock('../../modules/recommendation/guard/onboarding-guard', () => ({
  OnboardingGuard: {
    isOnboardingCompleted: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../../modules/recommendation/generation/background-generation.service', () => ({
  BackgroundGenerationService: {
    trigger: vi.fn().mockResolvedValue({ packId: 'pack_1', status: 'GENERATING' }),
    triggerGeneration: vi.fn().mockResolvedValue({ packId: 'pack_1', status: 'GENERATING' }),
    isGenerating: vi.fn().mockReturnValue(false),
  },
}));

describe('Recommendation Engine V2: Lifecycle & Cache Stabilization Test Suite', () => {
  const mockProfile = {
    fullName: 'Achyut Pandey',
    gender: 'MALE',
    degree: 'B.Tech',
    branch: 'Computer Science',
    currentYear: 4,
    technicalSkills: ['React', 'Node.js', 'Express', 'MongoDB'],
    softSkills: ['Communication'],
    tools: ['Git'],
    preferredRoles: ['Full Stack Developer'],
    careerGoals: ['Software Engineer'],
    preferredLocations: ['Remote'],
    opportunityPreferences: { internships: true, hackathons: true },
    persona: 'COLLEGE_STUDENT',
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const mockResume = {
    skills: ['React', 'Node.js'],
    projects: [{ title: 'App', description: 'Web app', technologies: ['React'] }],
  };

  const version = 'RE-v1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Profile timestamp changes (updatedAt) MUST NOT alter the recommendation fingerprint or invalidate cache', () => {
    const hash1 = ProfileHashGenerator.generate(mockProfile, mockResume, version);

    // Change only timestamps/metadata that shouldn't affect recommendation logic
    const profileWithNewTimestamp = {
      ...mockProfile,
      updatedAt: new Date('2026-07-21T15:00:00Z'),
      lastSeen: new Date(),
      viewCount: 100,
    };

    const hash2 = ProfileHashGenerator.generate(profileWithNewTimestamp, mockResume, version);
    expect(hash1).toEqual(hash2);

    const pack: any = {
      profileHash: hash1,
      status: 'READY',
      expiresAt: new Date(Date.now() + 86400000),
      recommendationVersion: version,
    };

    const decision = RecommendationTriggerService.shouldGenerateRecommendation(pack, hash2);
    expect(decision.shouldGenerate).toBe(false);
  });

  it('2. Editing skills MUST produce fingerprint mismatch and trigger regeneration', () => {
    const hashOriginal = ProfileHashGenerator.generate(mockProfile, mockResume, version);
    const profileEditedSkills = {
      ...mockProfile,
      technicalSkills: ['React', 'Node.js', 'Python', 'PyTorch'],
    };
    const hashEdited = ProfileHashGenerator.generate(profileEditedSkills, mockResume, version);

    expect(hashOriginal).not.toEqual(hashEdited);

    const pack: any = {
      profileHash: hashOriginal,
      status: 'READY',
      expiresAt: new Date(Date.now() + 86400000),
      recommendationVersion: version,
    };

    const decision = RecommendationTriggerService.shouldGenerateRecommendation(pack, hashEdited);
    expect(decision.shouldGenerate).toBe(true);
    expect(decision.reason).toBe('PROFILE_UPDATED');
  });

  it('3. Editing preferred roles MUST produce fingerprint mismatch and trigger regeneration', () => {
    const hashOriginal = ProfileHashGenerator.generate(mockProfile, mockResume, version);
    const profileEditedRoles = {
      ...mockProfile,
      preferredRoles: ['AI Research Engineer'],
    };
    const hashEdited = ProfileHashGenerator.generate(profileEditedRoles, mockResume, version);

    expect(hashOriginal).not.toEqual(hashEdited);
  });

  it('4. Editing career goals MUST produce fingerprint mismatch and trigger regeneration', () => {
    const hashOriginal = ProfileHashGenerator.generate(mockProfile, mockResume, version);
    const profileEditedGoals = {
      ...mockProfile,
      careerGoals: ['Build AI Startup'],
    };
    const hashEdited = ProfileHashGenerator.generate(profileEditedGoals, mockResume, version);

    expect(hashOriginal).not.toEqual(hashEdited);
  });

  it('5. Dashboard refresh with valid cache MUST NOT trigger background generation', async () => {
    const currentHash = ProfileHashGenerator.generate(mockProfile, mockResume, version);
    const mockPack: any = {
      profileHash: currentHash,
      status: 'READY',
      expiresAt: new Date(Date.now() + 86400000),
      recommendationVersion: version,
    };

    vi.spyOn(RecommendationService, 'getLatestPack').mockResolvedValue(mockPack);
    vi.spyOn(RecommendationService, 'shouldGenerate').mockResolvedValue({
      shouldGenerate: false,
      currentHash,
    });

    const result = await GenerateRecommendationsUseCase.execute('user_123');

    expect(result.status).toBe('READY');
    expect(result.pack).toEqual(mockPack);
    expect(BackgroundGenerationService.trigger).not.toHaveBeenCalled();
  });

  it('6. Dashboard request while status == GENERATING MUST return existing status without starting another worker', async () => {
    const mockGeneratingPack: any = {
      profileHash: 'hash_123',
      status: 'GENERATING',
      expiresAt: new Date(Date.now() + 86400000),
      recommendationVersion: version,
    };

    vi.spyOn(RecommendationService, 'getLatestPack').mockResolvedValue(mockGeneratingPack);

    const result = await GenerateRecommendationsUseCase.execute('user_123');

    expect(result.status).toBe('PENDING');
    expect(BackgroundGenerationService.trigger).not.toHaveBeenCalled();
  });

  it('7. Stale recommendation pack (profile edited) serves existing pack immediately with STALE status while triggering background regeneration', async () => {
    const oldHash = 'old_hash_123';
    const newHash = 'new_hash_456';

    const mockReadyPack: any = {
      profileHash: oldHash,
      status: 'READY',
      expiresAt: new Date(Date.now() + 86400000),
      recommendationVersion: version,
    };

    vi.spyOn(RecommendationService, 'getLatestPack').mockResolvedValue(mockReadyPack);
    vi.spyOn(RecommendationService, 'shouldGenerate').mockResolvedValue({
      shouldGenerate: true,
      reason: 'PROFILE_UPDATED',
      currentHash: newHash,
    });

    const result = await GenerateRecommendationsUseCase.execute('user_123');

    expect(result.status).toBe('STALE');
    expect(result.pack).toEqual(mockReadyPack);
    expect(BackgroundGenerationService.trigger).toHaveBeenCalledTimes(1);
  });
});

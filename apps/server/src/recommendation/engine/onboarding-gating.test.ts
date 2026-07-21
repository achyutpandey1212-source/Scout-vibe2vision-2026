import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OnboardingGuard } from '../../modules/recommendation/guard/onboarding-guard';
import { GenerateRecommendationsUseCase } from '../../modules/recommendation/use-cases/generate-recommendations.use-case';
import { UserIntelligenceModel } from '../../profile/models/user-intelligence.model';
import { ProfileModel } from '../../profile/models/profile.model';
import { BackgroundGenerationService } from '../../modules/recommendation/generation/background-generation.service';

vi.mock('../../profile/models/user-intelligence.model', () => ({
  UserIntelligenceModel: {
    findOne: vi.fn(),
  },
}));

vi.mock('../../profile/models/profile.model', () => ({
  ProfileModel: {
    findOne: vi.fn(),
  },
}));

vi.mock('../../modules/recommendation/generation/background-generation.service', () => ({
  BackgroundGenerationService: {
    trigger: vi.fn().mockResolvedValue({ packId: 'pack_123', status: 'GENERATING' }),
    triggerGeneration: vi.fn().mockResolvedValue({ packId: 'pack_123', status: 'GENERATING' }),
    isGenerating: vi.fn().mockReturnValue(false),
  },
}));

vi.mock('../../modules/recommendation/service/recommendation.service', () => ({
  RecommendationService: {
    getLatestPack: vi.fn().mockResolvedValue(null),
    shouldGenerate: vi
      .fn()
      .mockResolvedValue({ shouldGenerate: true, reason: 'LOGIN', currentHash: 'hash123' }),
  },
}));

describe('Recommendation Engine V2: Onboarding Gating & Trigger Verification', () => {
  const mockUserId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Scenario 1 & 2: New user / refresh during incomplete onboarding should return ONBOARDING_REQUIRED and NOT trigger background generation', async () => {
    vi.mocked(UserIntelligenceModel.findOne).mockResolvedValue(null as any);
    vi.mocked(ProfileModel.findOne).mockResolvedValue(null as any);

    const isCompleted = await OnboardingGuard.isOnboardingCompleted(mockUserId);
    expect(isCompleted).toBe(false);

    const result = await GenerateRecommendationsUseCase.execute(mockUserId);
    expect(result.status).toBe('ONBOARDING_REQUIRED');
    expect(result.pack).toBeNull();

    expect(BackgroundGenerationService.trigger).not.toHaveBeenCalled();
  });

  it('Scenario 3: Completing onboarding allows recommendation generation to trigger', async () => {
    vi.mocked(UserIntelligenceModel.findOne).mockResolvedValue({
      userId: mockUserId,
      onboarding: { completed: true },
    } as any);

    const isCompleted = await OnboardingGuard.isOnboardingCompleted(mockUserId);
    expect(isCompleted).toBe(true);

    const result = await GenerateRecommendationsUseCase.execute(mockUserId);
    expect(result.status).toBe('PENDING');
    expect(BackgroundGenerationService.trigger).toHaveBeenCalledTimes(1);
  });

  it('Scenario 4: Returning user with completed onboarding evaluates cache and triggers if stale/missing', async () => {
    vi.mocked(UserIntelligenceModel.findOne).mockResolvedValue({
      userId: mockUserId,
      onboarding: { completed: true },
    } as any);

    const result = await GenerateRecommendationsUseCase.execute(mockUserId);
    expect(result.status).toBe('PENDING');
    expect(BackgroundGenerationService.trigger).toHaveBeenCalledTimes(1);
  });
});

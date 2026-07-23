import { describe, it, expect, vi } from 'vitest';
import { DeleteUserUseCase } from './use-cases/delete-user.use-case';
import { UserModel } from '../../auth/models/user.model';
import { ProfileModel } from '../../profile/models/profile.model';
import { UserIntelligenceModel } from '../../profile/models/user-intelligence.model';
import { ResumeModel } from '../../profile/models/resume.model';
import { BookmarkModel } from '../../auth/models/bookmark.model';
import { RecommendationPackModel } from '../recommendation/schemas/recommendation-pack.schema';
import { RecommendationEventModel } from '../recommendation/analytics/recommendation-analytics.service';
import mongoose from 'mongoose';

describe('Admin Module: DeleteUserUseCase Verification', () => {
  it('should throw an error if user tries to delete their own authenticated admin account', async () => {
    const adminId = new mongoose.Types.ObjectId().toString();
    vi.spyOn(UserModel, 'findById').mockReturnValueOnce({
      exec: vi.fn().mockResolvedValue({ _id: adminId, email: 'admin@scout.local', role: 'ADMIN' }),
    } as any);

    await expect(DeleteUserUseCase.execute(adminId, adminId)).rejects.toThrow(
      'You cannot delete the currently authenticated administrator.',
    );
  });

  it('should throw an error for invalid user ID strings', async () => {
    await expect(DeleteUserUseCase.execute('invalid-id')).rejects.toThrow(
      'Invalid user ID specified.',
    );
  });

  it('should throw an error if target user is not found', async () => {
    const randomId = new mongoose.Types.ObjectId().toString();
    vi.spyOn(UserModel, 'findById').mockReturnValueOnce({
      exec: vi.fn().mockResolvedValue(null),
    } as any);

    await expect(DeleteUserUseCase.execute(randomId, 'differentAdminId')).rejects.toThrow(
      'User not found.',
    );
  });

  it('should perform cascading deletions across all user collections when authorized', async () => {
    const targetUserId = new mongoose.Types.ObjectId().toString();
    const mockUser = {
      _id: targetUserId,
      email: 'testuser@example.com',
      role: 'USER',
    };

    vi.spyOn(UserModel, 'findById').mockReturnValueOnce({
      exec: vi.fn().mockResolvedValue(mockUser),
    } as any);

    vi.spyOn(UserModel, 'deleteOne').mockResolvedValueOnce({ deletedCount: 1 } as any);
    vi.spyOn(ProfileModel, 'deleteMany').mockResolvedValueOnce({ deletedCount: 1 } as any);
    vi.spyOn(UserIntelligenceModel, 'deleteMany').mockResolvedValueOnce({ deletedCount: 1 } as any);
    vi.spyOn(ResumeModel, 'deleteMany').mockResolvedValueOnce({ deletedCount: 1 } as any);
    vi.spyOn(BookmarkModel, 'deleteMany').mockResolvedValueOnce({ deletedCount: 3 } as any);
    vi.spyOn(RecommendationPackModel, 'deleteMany').mockResolvedValueOnce({
      deletedCount: 5,
    } as any);
    vi.spyOn(RecommendationEventModel, 'deleteMany').mockResolvedValueOnce({
      deletedCount: 12,
    } as any);

    const result = await DeleteUserUseCase.execute(targetUserId, 'adminUserId123');

    expect(result.success).toBe(true);
    expect(result.deletedUserId).toBe(targetUserId);
    expect(result.stats).toEqual({
      user: 1,
      profiles: 1,
      intelligence: 1,
      resumes: 1,
      bookmarks: 3,
      packs: 5,
      analytics: 12,
    });
  });
});

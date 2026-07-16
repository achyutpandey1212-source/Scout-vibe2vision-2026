import { Response } from 'express';
import { AuthenticatedRequest } from '../../auth/types/auth.types';
import { ProfileModel } from '../models/profile.model';
import { ResumeModel } from '../models/resume.model';
import { calculateCareerReadiness } from '../utils/readiness-calculator';
import { z } from 'zod';

const ProfileV2UpdateSchema = z.object({
  fullName: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'UNKNOWN']).optional(),
  age: z.number().min(10).max(120).optional().nullable(),
  state: z.string().optional(),
  city: z.string().optional(),
  college: z.string().optional(),
  university: z.string().optional(),
  degree: z.string().optional(),
  branch: z.string().optional(),
  currentYear: z.number().min(1).max(6).optional().nullable(),
  expectedGraduation: z.number().min(2020).max(2045).optional().nullable(),
  cgpa: z.number().min(0).max(10).optional().nullable(),
  technicalSkills: z.array(z.string()).optional(),
  softSkills: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  interestDomains: z.array(z.string()).optional(),
  preferredRoles: z.array(z.string()).optional(),
  careerGoals: z.array(z.string()).optional(),
  primaryMotivation: z.string().optional(),
  secondaryMotivations: z.array(z.string()).optional(),
  biggestChallenge: z.string().optional(),
  confidenceProfile: z
    .object({
      applyIfNoMeet: z.string().optional(),
      avoidCompetitive: z.string().optional(),
      preferSafer: z.string().optional(),
    })
    .optional(),
  opportunityPreferences: z
    .object({
      internships: z.boolean().optional(),
      hackathons: z.boolean().optional(),
      scholarships: z.boolean().optional(),
      research: z.boolean().optional(),
      events: z.boolean().optional(),
      bootcamps: z.boolean().optional(),
      opensource: z.boolean().optional(),
      competitions: z.boolean().optional(),
      training: z.boolean().optional(),
      volunteer: z.boolean().optional(),
      earlyCareerPrograms: z.boolean().optional(),
      partTime: z.boolean().optional(),
    })
    .optional(),
  preferredLocations: z.array(z.string()).optional(),
  remotePreference: z.union([z.string(), z.boolean()]).optional(),
  relocationPreference: z.union([z.string(), z.boolean()]).optional(),
  preferredCompanySize: z.string().optional(),
  womenOnlyPreference: z.boolean().optional(),
  governmentPreference: z.boolean().optional(),
  startupPreference: z.boolean().optional(),
  persona: z
    .enum(['COLLEGE_STUDENT', 'WORKING_PROFESSIONAL', 'RETURN_TO_WORK', 'CAREER_SWITCHER'])
    .optional(),
  onboardingVersion: z.number().optional(),
});

export class ProfileV2Controller {
  static async getProfile(req: AuthenticatedRequest, res: Response) {
    if (!req.dbUser) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User identity not found in database.' },
      });
    }

    try {
      const userId = req.dbUser._id;
      let profile = await ProfileModel.findOne({ userId });

      if (!profile) {
        // Initialize an empty V2 profile
        profile = await ProfileModel.create({
          userId,
          fullName: '',
          gender: 'UNKNOWN',
          college: '',
          university: '',
          degree: '',
          branch: '',
          technicalSkills: [],
          interestDomains: [],
          preferredRoles: [],
          careerGoals: [],
          secondaryMotivations: [],
          biggestChallenge: '',
          confidenceProfile: {
            applyIfNoMeet: '',
            avoidCompetitive: '',
            preferSafer: '',
          },
          opportunityPreferences: {
            internships: false,
            hackathons: false,
            scholarships: false,
            research: false,
            events: false,
            bootcamps: false,
            opensource: false,
            competitions: false,
            training: false,
            volunteer: false,
            earlyCareerPrograms: false,
            partTime: false,
          },
          careerReadinessScore: 0,
          profileCompleteness: 0,
          resumeUploaded: false,
          githubConnected: false,
          linkedinConnected: false,
          portfolioConnected: false,
          persona: 'COLLEGE_STUDENT',
          onboardingVersion: 2,
        });
      }

      const readiness = calculateCareerReadiness(profile);

      return res.json({
        success: true,
        data: {
          profile,
          readiness,
        },
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[PROFILE V2] Error fetching profile:', errMsg);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve profile.' },
      });
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    if (!req.dbUser) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User identity not found in database.' },
      });
    }

    try {
      const userId = req.dbUser._id;

      // Validation check
      const parsed = ProfileV2UpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid payload.',
            details: parsed.error.format(),
          },
        });
      }

      // Upsert profile
      let profile = await ProfileModel.findOne({ userId });
      if (!profile) {
        profile = new ProfileModel({ userId });
      }

      // Apply changes manually or via Object.assign to respect nested schemas safely
      const updateData = parsed.data;

      // Update fields
      Object.keys(updateData).forEach((key) => {
        const value = (updateData as any)[key];
        if (value !== undefined) {
          if (key === 'confidenceProfile' || key === 'opportunityPreferences') {
            // Merge nested objects
            (profile as any)[key] = { ...(profile as any)[key], ...value };
          } else {
            (profile as any)[key] = value;
          }
        }
      });

      // Recalculate Career Readiness & Profile Completeness
      const readiness = calculateCareerReadiness(profile);
      profile.careerReadinessScore = readiness.careerReadinessScore;
      profile.profileCompleteness = readiness.completionPercentage;

      await profile.save();

      return res.json({
        success: true,
        data: {
          profile,
          readiness,
        },
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[PROFILE V2] Error updating profile:', errMsg);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update profile.' },
      });
    }
  }

  static async uploadResume(req: AuthenticatedRequest, res: Response) {
    if (!req.dbUser) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User identity not found in database.' },
      });
    }

    try {
      const userId = req.dbUser._id;
      const {
        fileName = 'resume.pdf',
        fileUrl = 'https://scout-resumes.storage.googleapis.com/placeholder.pdf',
      } = req.body;

      // Create/Update Resume document (placeholder for Phase 2)
      const resume = await ResumeModel.findOneAndUpdate(
        { userId },
        {
          userId,
          fileName,
          fileUrl,
          uploadedAt: new Date(),
          aiMetadata: {
            provider: 'none',
            model: 'none',
            confidence: 100,
            version: '1.0',
            parsedAt: new Date(),
          },
        },
        { upsert: true, returnDocument: 'after' },
      );

      // Mark resumeUploaded as true on Profile
      let profile = await ProfileModel.findOne({ userId });
      if (!profile) {
        profile = new ProfileModel({ userId });
      }
      profile.resumeUploaded = true;

      // Recalculate Career Readiness & Profile Completeness
      const readiness = calculateCareerReadiness(profile);
      profile.careerReadinessScore = readiness.careerReadinessScore;
      profile.profileCompleteness = readiness.completionPercentage;

      await profile.save();

      return res.json({
        success: true,
        data: {
          resume,
          profile,
          readiness,
        },
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[PROFILE V2] Error uploading resume:', errMsg);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to record resume upload.' },
      });
    }
  }
}

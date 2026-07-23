import { Response } from 'express';
import { AuthenticatedRequest } from '../../auth/types/auth.types';
import { ProfileModel } from '../models/profile.model';
import { ResumeModel } from '../models/resume.model';
import { calculateCareerReadiness } from '../utils/readiness-calculator';
import { DocumentExtractor } from '../services/document-extractor';
import { ResumeSectionParser } from '../services/resume-section-parser';
import { SkillNormalizer } from '../services/skill-normalizer';
import { ProfileMergeEngine } from '../services/profile-merge-engine';
import { SKILLS_VERSION } from '@scout/shared';
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
      const resume = await ResumeModel.findOne({ userId });

      return res.json({
        success: true,
        data: {
          profile,
          readiness,
          resume,
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

      let profile = await ProfileModel.findOne({ userId });
      if (!profile) {
        profile = new ProfileModel({ userId });
      }

      const updateData = parsed.data;
      Object.keys(updateData).forEach((key) => {
        const value = (updateData as any)[key];
        if (value !== undefined) {
          if (key === 'confidenceProfile' || key === 'opportunityPreferences') {
            (profile as any)[key] = { ...(profile as any)[key], ...value };
          } else {
            (profile as any)[key] = value;
          }
        }
      });

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
      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'No file uploaded.' },
        });
      }

      const extractorFile = {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
        buffer: file.buffer,
      };

      const extraction = await DocumentExtractor.extract(extractorFile);
      const rawText = extraction.rawText;
      const fileName = file.originalname;
      const fileUrl = 'https://scout-resumes.storage.googleapis.com/placeholder.pdf';

      // Segmentation parsing
      const parsed = ResumeSectionParser.parse(rawText);

      // Normalize Skills
      const normalizedSkills = SkillNormalizer.normalize(parsed.skillsText);

      // Create/Update Resume metadata in DB
      const resume = await ResumeModel.findOneAndUpdate(
        { userId },
        {
          userId,
          fileName,
          fileUrl,
          uploadedAt: new Date(),
          skills: normalizedSkills,
          education: [
            {
              institution: parsed.detectedCollege || '',
              degree: parsed.detectedDegree || '',
              fieldOfStudy: parsed.detectedFieldOfStudy || '',
              endDate: parsed.detectedGraduationYear
                ? parsed.detectedGraduationYear.toString()
                : '',
            },
          ],
          projects: parsed.detectedProjects.map((p) => ({
            title: p.title,
            description: p.description,
            technologies: p.technologies,
            url: p.githubLink || p.liveLink || '',
          })),
          experience: parsed.detectedExperience.map((e) => ({
            company: e.organization,
            role: e.role,
            startDate: e.startDate || '',
            endDate: e.endDate || '',
            description: e.description,
          })),
          links: parsed.detectedLinks,
          aiMetadata: {
            provider: 'pdf-parse',
            model: SKILLS_VERSION, // Store taxonomyVersion in model field to respect schema type
            confidence: parsed.overallConfidence,
            version: '1.0', // Store parserVersion in version field
            parsedAt: new Date(),
          },
        },
        { upsert: true, returnDocument: 'after' },
      );

      // Return DTO containing parsed fields, overall confidence, and warnings
      return res.json({
        success: true,
        data: {
          resume,
          overallConfidence: parsed.overallConfidence,
          warnings: parsed.warnings,
          layoutDetected: parsed.layoutDetected,
          parsedFields: {
            fullName: '',
            college: parsed.detectedCollege || '',
            degree: parsed.detectedDegree || '',
            branch: parsed.detectedFieldOfStudy || '',
            expectedGraduation: parsed.detectedGraduationYear || null,
            technicalSkills: normalizedSkills,
            detectedLinks: parsed.detectedLinks,
            detectedProjects: parsed.detectedProjects,
            detectedExperience: parsed.detectedExperience,
          },
        },
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[PROFILE V2] Error uploading resume:', errMsg);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to parse resume.' },
      });
    }
  }

  static async mergeProfile(req: AuthenticatedRequest, res: Response) {
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
        profile = new ProfileModel({ userId });
      }

      // Merge the user confirmed/edited fields using ProfileMergeEngine
      profile = ProfileMergeEngine.merge(profile, req.body);
      profile.resumeUploaded = true;

      // Recalculate Career Readiness
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
      console.error('[PROFILE V2] Error merging profile:', errMsg);
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to merge profile details.' },
      });
    }
  }
}

/**
 * ==========================================
 *          ONBOARDING V2 FROZEN
 *
 * Changing onboarding requires updating:
 * - Personalization
 * - Discovery
 * - Recommendation
 * ==========================================
 */
import mongoose, { Schema, Document } from 'mongoose';

export interface IProfile extends Document {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  age?: number;
  state: string;
  city: string;
  college: string;
  university: string;

  // Education
  degree: string;
  branch: string;
  currentYear?: number;
  expectedGraduation?: number;
  cgpa?: number;

  // Skills
  technicalSkills: string[];
  softSkills: string[];
  tools: string[];
  languages: string[];

  // Interests
  interestDomains: string[];
  preferredRoles: string[];
  careerGoals: string[];

  // Motivation Signals
  primaryMotivation?: string;
  secondaryMotivations: string[];
  biggestChallenge?: string;

  // Confidence Signals
  confidenceProfile?: any;
  hesitationLevel?: string;
  stretchPreference?: string;
  applicationConfidence?: string;

  // Preferences
  preferredLocations: string[];
  remotePreference?: string | boolean;
  relocationPreference?: string | boolean;
  preferredCompanySize?: string;
  womenOnlyPreference: boolean;
  governmentPreference: boolean;
  startupPreference: boolean;

  // Opportunity Preferences
  opportunityPreferences: {
    internships: boolean;
    hackathons: boolean;
    scholarships: boolean;
    research: boolean;
    events: boolean;
    bootcamps: boolean;
    opensource: boolean;
    competitions: boolean;
    training: boolean;
    volunteer: boolean;
    earlyCareerPrograms: boolean;
    partTime: boolean;
  };

  // Career Readiness
  careerReadinessScore: number;
  profileCompleteness: number;
  resumeUploaded: boolean;
  githubConnected: boolean;
  linkedinConnected: boolean;
  portfolioConnected: boolean;

  // Metadata
  persona: 'COLLEGE_STUDENT' | 'WORKING_PROFESSIONAL' | 'RETURN_TO_WORK' | 'CAREER_SWITCHER';
  onboardingVersion: number;
  lastRecommendationRefresh?: Date;
  notificationPreferences?: {
    dailyDelta: boolean;
    deadlineReminders: boolean;
    unlockAlerts: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    fullName: { type: String, default: '' },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'UNKNOWN'],
      default: 'UNKNOWN',
      index: true,
    },
    age: { type: Number },
    state: { type: String, default: '' },
    city: { type: String, default: '' },
    college: { type: String, default: '' },
    university: { type: String, default: '' },

    // Education
    degree: { type: String, default: '' },
    branch: { type: String, default: '' },
    currentYear: { type: Number },
    expectedGraduation: { type: Number },
    cgpa: { type: Number },

    // Skills
    technicalSkills: { type: [String], default: [] },
    softSkills: { type: [String], default: [] },
    tools: { type: [String], default: [] },
    languages: { type: [String], default: [] },

    // Interests
    interestDomains: { type: [String], default: [] },
    preferredRoles: { type: [String], default: [] },
    careerGoals: { type: [String], default: [] },

    // Motivation Signals
    primaryMotivation: { type: String, default: '' },
    secondaryMotivations: { type: [String], default: [] },
    biggestChallenge: { type: String, default: '' },

    // Confidence Signals
    confidenceProfile: { type: Schema.Types.Mixed, default: {} },
    hesitationLevel: { type: String, default: 'Medium' },
    stretchPreference: { type: String, default: 'Medium' },
    applicationConfidence: { type: String, default: 'Medium' },

    // Preferences
    preferredLocations: { type: [String], default: [] },
    remotePreference: { type: Schema.Types.Mixed, default: false },
    relocationPreference: { type: Schema.Types.Mixed, default: false },
    preferredCompanySize: { type: String, default: 'Any' },
    womenOnlyPreference: { type: Boolean, default: true },
    governmentPreference: { type: Boolean, default: false },
    startupPreference: { type: Boolean, default: false },

    // Opportunity Preferences
    opportunityPreferences: {
      internships: { type: Boolean, default: false },
      hackathons: { type: Boolean, default: false },
      scholarships: { type: Boolean, default: false },
      research: { type: Boolean, default: false },
      events: { type: Boolean, default: false },
      bootcamps: { type: Boolean, default: false },
      opensource: { type: Boolean, default: false },
      competitions: { type: Boolean, default: false },
      training: { type: Boolean, default: false },
      volunteer: { type: Boolean, default: false },
      earlyCareerPrograms: { type: Boolean, default: false },
      partTime: { type: Boolean, default: false },
    },

    // Career Readiness
    careerReadinessScore: { type: Number, default: 0 },
    profileCompleteness: { type: Number, default: 0 },
    resumeUploaded: { type: Boolean, default: false },
    githubConnected: { type: Boolean, default: false },
    linkedinConnected: { type: Boolean, default: false },
    portfolioConnected: { type: Boolean, default: false },

    // Metadata
    persona: {
      type: String,
      enum: ['COLLEGE_STUDENT', 'WORKING_PROFESSIONAL', 'RETURN_TO_WORK', 'CAREER_SWITCHER'],
      default: 'COLLEGE_STUDENT',
      index: true,
    },
    onboardingVersion: { type: Number, default: 2 },
    lastRecommendationRefresh: { type: Date },
    notificationPreferences: {
      dailyDelta: { type: Boolean, default: true },
      deadlineReminders: { type: Boolean, default: true },
      unlockAlerts: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  },
);

export const ProfileModel =
  mongoose.models.Profile || mongoose.model<IProfile>('Profile', ProfileSchema);

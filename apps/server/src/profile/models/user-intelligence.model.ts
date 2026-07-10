import mongoose, { Schema, Document } from 'mongoose';

export interface IUserIntelligence extends Document {
  userId: mongoose.Types.ObjectId;
  onboarding: {
    version: string;
    completed: boolean;
    currentStep: number;
    completedAt: Date | null;
  };
  identity: {
    preferredName: string;
  };
  situations: string[];
  educationDetail?: {
    qualification?: string;
    college?: string;
    course?: string;
    graduationYear?: number;
  };
  workDetail?: {
    role?: string;
    industry?: string;
    experienceYears?: number;
  };
  whyHere: string[];
  happiestDestination?: string;
  magicOneProblem?: string;
  timeLossActivities: string[];
  readinessIllustrativeLevel?: number;
  biggestObstacles: string[];
  discoveryChannels: string[];
  motivatedTime: string[];
  availability?: {
    timeOfDay?: string[];
    hoursPerWeek?: number;
  };
  opportunityExcitement: string[];
  workPreferences: string[];
  companionPreferences: {
    tone: string;
    celebrationStyle: string;
    guidanceLevel: string;
    preferredLanguage: string;
    reminderStyle: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const UserIntelligenceSchema = new Schema<IUserIntelligence>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    onboarding: {
      version: { type: String, default: '1.0' },
      completed: { type: Boolean, default: false },
      currentStep: { type: Number, default: 1 },
      completedAt: { type: Date, default: null },
    },
    identity: {
      preferredName: { type: String, default: '' },
    },
    situations: { type: [String], default: [] },
    educationDetail: {
      qualification: { type: String, default: null },
      college: { type: String, default: null },
      course: { type: String, default: null },
      graduationYear: { type: Number, default: null },
    },
    workDetail: {
      role: { type: String, default: null },
      industry: { type: String, default: null },
      experienceYears: { type: Number, default: null },
    },
    whyHere: { type: [String], default: [] },
    happiestDestination: { type: String, default: null },
    magicOneProblem: { type: String, default: null },
    timeLossActivities: { type: [String], default: [] },
    readinessIllustrativeLevel: { type: Number, default: null },
    biggestObstacles: { type: [String], default: [] },
    discoveryChannels: { type: [String], default: [] },
    motivatedTime: { type: [String], default: [] },
    availability: {
      timeOfDay: { type: [String], default: [] },
      hoursPerWeek: { type: Number, default: null },
    },
    opportunityExcitement: { type: [String], default: [] },
    workPreferences: { type: [String], default: [] },
    companionPreferences: {
      tone: { type: String, default: 'gentle' },
      celebrationStyle: { type: String, default: '🌸 Gentle' },
      guidanceLevel: { type: String, default: 'Recommend opportunities' },
      preferredLanguage: { type: String, default: 'English' },
      reminderStyle: { type: String, default: 'Flexible' },
    },
  },
  {
    timestamps: true,
  },
);

export const UserIntelligenceModel =
  mongoose.models.UserIntelligence ||
  mongoose.model<IUserIntelligence>('UserIntelligence', UserIntelligenceSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
  userId: mongoose.Types.ObjectId;
  fileUrl: string;
  fileName: string;
  uploadedAt: Date;

  // Parsed Data
  education: Array<{
    institution?: string;
    degree?: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    cgpa?: string | number;
  }>;
  experience: Array<{
    company?: string;
    role?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  projects: Array<{
    title?: string;
    description?: string;
    technologies?: string[];
    url?: string;
  }>;
  skills: string[];
  certifications: string[];
  achievements: string[];
  links: Array<{
    label?: string;
    url?: string;
  }>;

  // AI Extraction Metadata
  aiMetadata: {
    provider: string;
    model: string;
    confidence: number;
    version: string;
    parsedAt: Date;
  };
}

const ResumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },

    // Parsed Data
    education: [
      {
        institution: { type: String },
        degree: { type: String },
        fieldOfStudy: { type: String },
        startDate: { type: String },
        endDate: { type: String },
        cgpa: { type: Schema.Types.Mixed },
      },
    ],
    experience: [
      {
        company: { type: String },
        role: { type: String },
        startDate: { type: String },
        endDate: { type: String },
        description: { type: String },
      },
    ],
    projects: [
      {
        title: { type: String },
        description: { type: String },
        technologies: { type: [String] },
        url: { type: String },
      },
    ],
    skills: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    achievements: { type: [String], default: [] },
    links: [
      {
        label: { type: String },
        url: { type: String },
      },
    ],

    // AI Metadata
    aiMetadata: {
      provider: { type: String },
      model: { type: String },
      confidence: { type: Number },
      version: { type: String },
      parsedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  },
);

export const ResumeModel =
  mongoose.models.Resume || mongoose.model<IResume>('Resume', ResumeSchema);

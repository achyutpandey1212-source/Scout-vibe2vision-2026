import mongoose, { Schema, Document } from 'mongoose';
import { Opportunity } from '../types/opportunity.types';

export interface IOpportunity extends Omit<Opportunity, 'rawPageId'>, Document {
  rawPageId: mongoose.Types.ObjectId;
}

const OpportunitySchema = new Schema<IOpportunity>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    summary: { type: String, required: true },
    organization: { type: String, required: true },
    opportunityType: {
      type: String,
      required: true,
      index: true,
    },
    category: { type: String, required: true, index: true },
    country: { type: String, default: null },
    state: { type: String, default: null },
    city: { type: String, default: null },
    remote: { type: Boolean, default: false, index: true },
    applicationUrl: { type: String, required: true, unique: true, index: true },
    officialWebsite: { type: String, default: null },
    deadline: { type: String, default: null, index: true },
    startDate: { type: String, default: null },
    endDate: { type: String, default: null },
    salary: { type: Number, default: null },
    stipend: { type: Number, default: null },
    currency: { type: String, default: null },
    duration: { type: String, default: null },
    eligibility: { type: String, default: null },
    minimumQualification: { type: String, default: null },
    skills: { type: [String], index: true },
    experienceLevel: { type: String, default: null },
    ageLimit: { type: Number, default: null },
    genderEligibility: { type: String, default: null },
    documentsRequired: [{ type: String }],
    selectionProcess: { type: String, default: null },
    benefits: { type: String, default: null },
    tags: [{ type: String }],
    sourceURL: { type: String, required: true, unique: true, index: true },
    sourceDomain: { type: String, required: true },
    sourceType: {
      type: String,
      required: true,
      index: true,
    },
    confidence: { type: Number, required: true },
    rawPageId: { type: Schema.Types.ObjectId, ref: 'RawPage', required: true },
    aiMetadata: {
      provider: { type: String, required: true },
      model: { type: String, required: true },
      latencyMs: { type: Number, required: true },
      extractionVersion: { type: String, required: true },
    },
    hash: { type: String, required: true },

    audiencePersonas: { type: [String], default: [], index: true },
    educationEligibility: [{ type: String }],
    professionalDomains: [{ type: String }],
    experienceRequired: { type: String, default: 'NONE', index: true },
    fundingType: { type: String, default: null, index: true },
    estimatedCompetition: { type: String, default: null, index: true },
    organizationType: { type: String, default: null, index: true },

    applicationDifficulty: { type: String, default: null, index: true },

    goldReasons: { type: [String], default: [] },

    trustScore: { type: Number, default: 0, index: true },

    discoveredAt: { type: Date, default: Date.now },
    firstSeenAt: { type: Date, default: Date.now },
    lastCheckedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null, index: true },
    archived: { type: Boolean, default: false, index: true },

    trustLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'],
      default: 'LOW',
      index: true,
    },
    qualityScore: { type: Number, default: 0, index: true },
    qualityBreakdown: {
      officialSource: { type: Boolean, default: false },
      deadlinePresent: { type: Boolean, default: false },
      applicationLink: { type: Boolean, default: false },
      richDescription: { type: Boolean, default: false },
      benefitsPresent: { type: Boolean, default: false },
      stipendPresent: { type: Boolean, default: false },
    },

    opportunityScore: { type: Number, default: 0, index: true },
    goldOpportunity: { type: Boolean, default: false, index: true },
    scoreBreakdown: { type: Schema.Types.Mixed, default: {} },
    companyTier: { type: Number, default: 3, index: true },

    workMode: {
      type: String,
      enum: ['REMOTE', 'HYBRID', 'ONSITE', null],
      default: null,
      index: true,
    },
    fundingStatus: { type: String, enum: ['PAID', 'UNPAID', null], default: null, index: true },
    visaSponsored: { type: Boolean, default: false },
    travelFunded: { type: Boolean, default: false },

    intelligence: {
      type: {
        normalizedOrganization: { type: String, default: null },
        normalizedDeadline: { type: String, default: null },
        daysRemaining: { type: Number, default: null },
        expired: { type: Boolean, default: false },
        metadata: {
          type: {
            country: { type: String, default: null },
            state: { type: String, default: null },
            city: { type: String, default: null },
            isGovernment: { type: Boolean, default: false },
            isRemote: { type: Boolean, default: false },
            isPaid: { type: Boolean, default: false },
            hasDeadline: { type: Boolean, default: false },
            requiresResume: { type: Boolean, default: false },
            requiresPortfolio: { type: Boolean, default: false },
            requiresExperience: { type: Boolean, default: false },
            requiresDegree: { type: Boolean, default: false },
          },
          default: null,
        },
        version: { type: String, default: '1.0' },
        enriched: { type: Boolean, default: false },
        lastEnrichedAt: { type: Date, default: null },
        lastProcessedAt: { type: Date, default: null },
        scores: {
          trust: { type: Number, default: 0 },
          popularity: { type: Number, default: 0 },
          hidden: { type: Number, default: 0 },
          quality: { type: Number, default: 0 },
        },
        scoreBreakdown: {
          trustFactors: { type: Map, of: Number, default: {} },
          popularityFactors: { type: Map, of: Number, default: {} },
          hiddenFactors: { type: Map, of: Number, default: {} },
          qualityFactors: { type: Map, of: Number, default: {} },
        },
      },
      default: null,
    },

    canonicalId: { type: String, default: null },
    slug: { type: String, default: null },
    type: { type: String, index: true, default: null },
    subCategory: { type: String, default: null },
    eligibleBranches: { type: [String], index: true, default: [] },
    eligibleYears: { type: [String], default: [] },
    minimumEducation: { type: String, default: null },
    requirements: { type: [String], default: [] },
    hybrid: { type: Boolean, default: false },
    onsite: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    sourceUrl: { type: String, index: true, sparse: true },
    officialPage: { type: String, default: null },
    crawlDate: { type: Date, default: null },
    crawlMethod: { type: String, default: null },
    contentHash: { type: String, default: null },
    lastSeen: { type: Date, default: null },
    lastUpdated: { type: Date, default: null },
    keywords: { type: [String], default: [] },
    hiddenGemScore: { type: Number, index: true, default: null },
    sourceAuthority: { type: Number, default: null },
    recommendationTags: { type: [String], default: [] },
    careerStages: { type: [String], default: [] },
    domains: { type: [String], default: [] },
    difficulty: { type: String, default: null },
    womenFocused: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    visibility: {
      type: String,
      enum: ['PUBLIC', 'PRIVATE', 'HIDDEN'],
      default: 'PUBLIC',
      index: true,
    },

    commitment: {
      type: String,
      enum: ['PART_TIME', 'FULL_TIME', 'FLEXIBLE', null],
      default: null,
      index: true,
    },
    organizationStage: {
      type: String,
      enum: [
        'EARLY_STARTUP',
        'GROWTH_STARTUP',
        'SCALE_UP',
        'ENTERPRISE',
        'GOVERNMENT',
        'ACADEMIC',
        null,
      ],
      default: null,
      index: true,
    },
    skillsTechnical: [{ type: String }],
    skillsSoft: [{ type: String }],
    skillsTools: [{ type: String }],
    suitableFirstYear: { type: Boolean, default: false, index: true },
    suitableSecondYear: { type: Boolean, default: false, index: true },
    suitableThirdYear: { type: Boolean, default: false, index: true },
    suitableFourthYear: { type: Boolean, default: false, index: true },
    suitableGraduate: { type: Boolean, default: false, index: true },
    suitabilityReason: { type: String, default: null },
    careerValResume: { type: Number, default: 0 },
    careerValLearning: { type: Number, default: 0 },
    careerValNetworking: { type: Number, default: 0 },
    careerValExposure: { type: Number, default: 0 },
    careerValPortfolio: { type: Number, default: 0 },
    careerValResearch: { type: Number, default: 0 },
    careerValInterview: { type: Number, default: 0 },
    deadlineStatus: {
      type: String,
      enum: ['OPEN', 'CLOSING_SOON', 'ROLLING', 'UNKNOWN', 'EXPIRED'],
      default: 'UNKNOWN',
      index: true,
    },
    relatedSimilar: [{ type: String }],
    relatedSameOrg: [{ type: String }],
    relatedSameDomain: [{ type: String }],
    relatedSameSkills: [{ type: String }],
    readinessScore: { type: Number, default: 0, index: true },
    readinessStatus: {
      type: String,
      enum: ['READY', 'NEEDS_REVIEW'],
      default: 'NEEDS_REVIEW',
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save hook for backward compatibility syncing
OpportunitySchema.pre('save', function (this: any, next: any) {
  if (this.opportunityType && !this.type) {
    this.type = this.opportunityType;
  } else if (this.type && !this.opportunityType) {
    this.opportunityType = this.type as any;
  }

  if (this.sourceURL && !this.sourceUrl) {
    this.sourceUrl = this.sourceURL;
  } else if (this.sourceUrl && !this.sourceURL) {
    this.sourceURL = this.sourceUrl;
  }

  if (this.discoveredAt && !this.publishedAt) {
    this.publishedAt = this.discoveredAt;
  } else if (this.publishedAt && !this.discoveredAt) {
    this.discoveredAt = this.publishedAt;
  }

  if (this.officialWebsite && !this.officialPage) {
    this.officialPage = this.officialWebsite;
  } else if (this.officialPage && !this.officialWebsite) {
    this.officialWebsite = this.officialPage;
  }

  if (this.applicationDifficulty && !this.difficulty) {
    this.difficulty = this.applicationDifficulty;
  } else if (this.difficulty && !this.applicationDifficulty) {
    this.applicationDifficulty = this.difficulty as any;
  }

  if (this.hash && !this.contentHash) {
    this.contentHash = this.hash;
  } else if (this.contentHash && !this.hash) {
    this.hash = this.contentHash;
  }

  next();
});

export const OpportunityModel =
  mongoose.models.Opportunity || mongoose.model<IOpportunity>('Opportunity', OpportunitySchema);

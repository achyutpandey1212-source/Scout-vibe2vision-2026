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
    skills: [{ type: String }],
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

    // ── Audience Intelligence ───────────────────────────────────────────────
    audiencePersonas: { type: [String], default: [], index: true },
    educationEligibility: [{ type: String }],
    professionalDomains: [{ type: String }],
    experienceRequired: { type: String, default: null, index: true },
    fundingType: { type: String, default: null, index: true },
    searchCategory: { type: String, default: null, index: true },
    estimatedCompetition: { type: String, default: null, index: true },
    organizationType: { type: String, default: null, index: true },

    // ── Product Verticals & Friction (New persistent fields) ────────────────
    opportunityVertical: { type: String, default: null, index: true },
    applicationDifficulty: { type: String, default: null, index: true },

    // ── Gold Opportunity System ──────────────────────────────────────────────
    goldReasons: { type: [String], default: [] },

    // ── Trust Scoring ────────────────────────────────────────────────────────
    trustScore: { type: Number, default: 0, index: true },

    // Freshness & Archiving
    discoveredAt: { type: Date, default: Date.now },
    firstSeenAt: { type: Date, default: Date.now },
    lastCheckedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null, index: true },
    archived: { type: Boolean, default: false, index: true },

    // Trust & Quality Metrics
    trustLevel: {
      type: String,
      enum: ['VERIFIED', 'OFFICIAL', 'COMMUNITY', 'UNKNOWN'],
      default: 'UNKNOWN',
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

    // Enriched Metadata
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
  },
  {
    timestamps: true,
  },
);

export const OpportunityModel =
  mongoose.models.Opportunity || mongoose.model<IOpportunity>('Opportunity', OpportunitySchema);

import mongoose, { Schema } from 'mongoose';
import { IRecommendationPack } from '../types/recommendation.types';

const RecommendationItemSchema = new Schema({
  // ── Core matching fields ──────────────────────────────────────────────────
  opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity' },
  score: { type: Number },
  confidence: { type: Number },
  scoreBreakdown: { type: Schema.Types.Mixed, default: {} },

  // ── Legacy snippet fields (kept for backward compatibility) ───────────────
  personalizedReason: { type: String },
  whyNow: { type: String },
  missingSkills: { type: [String], default: [] },
  firstAction: { type: String },
  confidenceMessage: { type: String },

  // ── Full Career Report fields ─────────────────────────────────────────────
  executiveSummary: { type: String },
  whyScoutPickedThis: { type: String },
  strongestStrengths: { type: [String], default: [] },
  resumeImprovements: { type: [String], default: [] },
  interviewPrep: { type: [String], default: [] },
  applicationConfidence: { type: Schema.Types.Mixed, default: {} },
  nextAction: { type: String },
  scoutVerdict: { type: Schema.Types.Mixed, default: {} },
  projectEvidence: { type: String },
  whyYou: { type: String },
  whyCompany: { type: String },
  strengths: { type: [String], default: [] },
  challenges: { type: [String], default: [] },
  applicationStrategy: { type: String },
  preparationChecklist: { type: [String], default: [] },
});

const RecommendationPackSchema = new Schema<IRecommendationPack>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['GENERATING', 'READY', 'FAILED', 'EXPIRED'],
      required: true,
      index: true,
    },
    generatedAt: { type: Date, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    recommendationVersion: { type: String, required: true, index: true },
    profileHash: { type: String, required: true },
    generationReason: {
      type: String,
      enum: [
        'LOGIN',
        'ONBOARDING_COMPLETE',
        'PROFILE_UPDATED',
        'RESUME_UPDATED',
        'MANUAL_REFRESH',
        'VERSION_CHANGED',
        'CACHE_EXPIRED',
        'ADMIN_FORCE',
        'ADMIN_REGENERATE',
        'ADMIN_DRY_RUN',
      ],
    },
    todayMission: { type: String, maxLength: 120 },
    perfectMatch: { type: RecommendationItemSchema, default: {} },
    hiddenGem: { type: RecommendationItemSchema, default: {} },
    stretchGoal: { type: RecommendationItemSchema, default: {} },
    quickWin: { type: RecommendationItemSchema, default: {} },
    confidenceBuilder: { type: RecommendationItemSchema, default: {} },
    aiSummary: { type: String },
    metadata: {
      provider: { type: String },
      model: { type: String },
      promptVersion: { type: String },
      schemaVersion: { type: String },
      engineVersion: { type: String },
      recommendationVersion: { type: String },
      scoringVersion: { type: String },
      experimentVersion: { type: String },
      discoverySnapshotVersion: { type: String },
      experimentGroup: { type: String },
      qualityScore: { type: Number },
      generationTimeMs: { type: Number },
      candidateCount: { type: Number },
      filteredCount: { type: Number },
      aiLatency: { type: Number },
      cacheHit: { type: Boolean },
      fallbackUsed: { type: Boolean },
      repairUsed: { type: Boolean },
      promptLength: { type: Number },
      responseLength: { type: Number },
      promptHash: { type: String },
    },
    progressPhase: {
      type: String,
      enum: [
        'RETRIEVING',
        'FILTERING',
        'SCORING',
        'DIVERSIFYING',
        'PERSONALIZING',
        'BUILDING_PACK',
        'COMPLETED',
      ],
    },
  },
  {
    timestamps: true,
  },
);

export const RecommendationPackModel =
  mongoose.models.RecommendationPack ||
  mongoose.model<IRecommendationPack>('RecommendationPack', RecommendationPackSchema);

import mongoose, { Document } from 'mongoose';

export type RecommendationStatus = 'GENERATING' | 'READY' | 'FAILED' | 'EXPIRED';

export type RecommendationGenerationReason =
  | 'LOGIN'
  | 'ONBOARDING_COMPLETE'
  | 'PROFILE_UPDATED'
  | 'RESUME_UPDATED'
  | 'MANUAL_REFRESH'
  | 'VERSION_CHANGED'
  | 'CACHE_EXPIRED'
  | 'ADMIN_FORCE';

export interface IRecommendationItem {
  opportunityId?: mongoose.Types.ObjectId;
  score?: number;
  confidence?: number;
  personalizedReason?: string;
  whyNow?: string;
  missingSkills?: string[];
  firstAction?: string;
  scoreBreakdown?: Record<string, number>;
}

export interface IRecommendationMetadata {
  provider: string;
  model: string;
  promptVersion: string;
  schemaVersion?: string;
  engineVersion?: string;
  recommendationVersion?: string;
  scoringVersion?: string;
  experimentVersion?: string;
  discoverySnapshotVersion?: string;
  experimentGroup?: string;
  qualityScore?: number;
  generationTimeMs: number;
  candidateCount: number;
  filteredCount: number;
  aiLatency: number;
  cacheHit: boolean;
  fallbackUsed?: boolean;
  repairUsed?: boolean;
  promptLength?: number;
  responseLength?: number;
  promptHash?: string;
}

export interface IRecommendationPack extends Document {
  userId: mongoose.Types.ObjectId;
  status: RecommendationStatus;
  generatedAt: Date;
  expiresAt: Date;
  recommendationVersion: string;
  profileHash: string;
  generationReason?: RecommendationGenerationReason;
  todayMission?: string;
  perfectMatch?: IRecommendationItem;
  hiddenGem?: IRecommendationItem;
  stretchGoal?: IRecommendationItem;
  quickWin?: IRecommendationItem;
  confidenceBuilder?: IRecommendationItem;
  aiSummary?: string;
  metadata?: IRecommendationMetadata;
  progressPhase?:
    | 'RETRIEVING'
    | 'FILTERING'
    | 'SCORING'
    | 'DIVERSIFYING'
    | 'PERSONALIZING'
    | 'BUILDING_PACK'
    | 'COMPLETED';
  createdAt: Date;
  updatedAt: Date;
}

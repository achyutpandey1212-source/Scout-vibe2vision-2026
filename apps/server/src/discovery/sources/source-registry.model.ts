import mongoose, { Schema, Document } from 'mongoose';
import {
  ISourceRegistryEntry,
  CrawlFrequency,
  CrawlStrategy,
  DiscoveredBy,
  SourcePriority,
  SourceType,
  EcosystemType,
} from './source-registry.types';
import { ACTIVE_SOURCE_CATEGORIES } from '@scout/shared';

export interface ISourceRegistryDocument extends ISourceRegistryEntry, Document {}

const SourceRegistrySchema = new Schema<ISourceRegistryDocument>(
  {
    domain: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    organization: { type: String, required: true, trim: true },
    homepage: { type: String, required: true, trim: true },
    sourceType: {
      type: String,
      enum: [
        'Organization',
        'Company',
        'University',
        'Government',
        'NGO',
        'Community',
        'Platform',
        'Hackathon',
        'Open Source',
        'Other',
      ] satisfies SourceType[],
      default: 'Organization',
    },
    category: {
      type: String,
      enum: ACTIVE_SOURCE_CATEGORIES,
      required: true,
    },
    strategy: {
      type: String,
      enum: ['direct', 'search', 'sitemap', 'rss'] satisfies CrawlStrategy[],
      required: true,
    },
    crawlFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'] satisfies CrawlFrequency[],
      required: true,
    },
    defaultTags: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true },

    trustScore: { type: Number, required: true, min: 0, max: 100 },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'] satisfies SourcePriority[],
      default: 'medium',
    },

    confidence: { type: Number, default: 0, min: 0, max: 100 },
    reason: { type: String, default: '' },
    verifiedByAIAt: { type: Date, default: null },
    lastVerifiedAt: { type: Date, default: null },

    discoveredBy: {
      type: String,
      enum: ['seed', 'weekly-discovery', 'affiliate-extraction', 'manual'] satisfies DiscoveredBy[],
      required: true,
    },
    discoveredAt: { type: Date, default: Date.now },
    lastCrawledAt: { type: Date, default: null },
    nextCrawlAt: { type: Date, default: Date.now },

    consecutiveFailures: { type: Number, default: 0 },
    consecutiveEmptyRuns: { type: Number, default: 0 },

    totalRuns: { type: Number, default: 0 },
    totalPagesCrawled: { type: Number, default: 0 },
    totalOpportunitiesFound: { type: Number, default: 0 },
    opportunityDensity: { type: Number, default: 0 },

    sourceTier: {
      type: String,
      enum: ['A', 'B', 'C'],
      default: 'B',
      required: true,
    },
    discoveryValue: { type: Number, default: 50, min: 0, max: 100 },
    studentRelevance: { type: Number, default: 50, min: 0, max: 100 },
    freshnessScore: { type: Number, default: 50, min: 0, max: 100 },
    ecosystemType: {
      type: String,
      enum: [
        'STARTUP',
        'INCUBATOR',
        'UNIVERSITY',
        'RESEARCH',
        'GOVERNMENT',
        'COMMUNITY',
        'OPEN_SOURCE',
        'NON_PROFIT',
      ] satisfies EcosystemType[],
      default: null,
      required: true,
    },
    ecosystemName: { type: String, default: null },
    startupStage: { type: String, default: null },
    region: { type: String, default: null },
    engineeringFocus: [{ type: String }],
    remoteFriendly: { type: Boolean, default: false },
    internshipFriendly: { type: Boolean, default: true },
    averageOpportunityQuality: { type: Number, default: null },
    averageHiddenGemScore: { type: Number, default: null },
    sourceReason: { type: String, default: null },
  },
  {
    timestamps: true,
  },
);

SourceRegistrySchema.index({ isActive: 1, nextCrawlAt: 1, trustScore: -1 });
SourceRegistrySchema.index({ category: 1, priority: 1 });
SourceRegistrySchema.index({ discoveredBy: 1 });
SourceRegistrySchema.index({ opportunityDensity: -1 });

export const SourceRegistryModel =
  mongoose.models.SourceRegistry ||
  mongoose.model<ISourceRegistryDocument>('SourceRegistry', SourceRegistrySchema);

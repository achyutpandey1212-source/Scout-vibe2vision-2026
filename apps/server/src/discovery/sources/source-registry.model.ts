import mongoose, { Schema, Document } from 'mongoose';
import {
  ISourceRegistryEntry,
  CrawlFrequency,
  CrawlStrategy,
  DiscoveredBy,
  SourceCategory,
  SourcePriority,
  SourceType,
} from './source-registry.types';

export interface ISourceRegistryDocument extends ISourceRegistryEntry, Document {}

const SourceRegistrySchema = new Schema<ISourceRegistryDocument>(
  {
    // ─── Identity ──────────────────────────────────────────────────────────
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
        'Job Board',
        'Hackathon',
        'Conference',
        'Research Lab',
        'Other',
      ] satisfies SourceType[],
      default: 'Organization',
    },
    category: {
      type: String,
      enum: [
        'TECH_CAREERS',
        'WOMEN_IN_TECH',
        'SCHOLARSHIPS',
        'FELLOWSHIPS',
        'GOVERNMENT',
        'HACKATHONS',
        'ENTREPRENEURSHIP',
        'RESEARCH',
        'SKILL_DEVELOPMENT',
        'GENERAL',
      ] satisfies SourceCategory[],
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

    // ─── Trust & Priority ──────────────────────────────────────────────────
    trustScore: { type: Number, required: true, min: 0, max: 100 },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'] satisfies SourcePriority[],
      default: 'medium',
    },

    // ─── AI Verification ───────────────────────────────────────────────────
    confidence: { type: Number, default: 0, min: 0, max: 100 },
    reason: { type: String, default: '' },
    verifiedByAIAt: { type: Date, default: null },
    lastVerifiedAt: { type: Date, default: null },

    // ─── Discovery Provenance ──────────────────────────────────────────────
    discoveredBy: {
      type: String,
      enum: ['seed', 'weekly-discovery', 'affiliate-extraction', 'manual'] satisfies DiscoveredBy[],
      required: true,
    },
    discoveredAt: { type: Date, default: Date.now },
    lastCrawledAt: { type: Date, default: null },
    nextCrawlAt: { type: Date, default: Date.now },

    // ─── Health ────────────────────────────────────────────────────────────
    consecutiveFailures: { type: Number, default: 0 },

    // ─── Analytics ─────────────────────────────────────────────────────────
    totalRuns: { type: Number, default: 0 },
    totalPagesCrawled: { type: Number, default: 0 },
    totalOpportunitiesFound: { type: Number, default: 0 },
    opportunityDensity: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Primary query path: Crawl Scheduler daily run
SourceRegistrySchema.index({ isActive: 1, nextCrawlAt: 1, trustScore: -1 });

// Admin and analytics queries
SourceRegistrySchema.index({ category: 1, priority: 1 });
SourceRegistrySchema.index({ discoveredBy: 1 });

// Future: auto-frequency optimization queries
SourceRegistrySchema.index({ opportunityDensity: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────

export const SourceRegistryModel =
  mongoose.models.SourceRegistry ||
  mongoose.model<ISourceRegistryDocument>('SourceRegistry', SourceRegistrySchema);

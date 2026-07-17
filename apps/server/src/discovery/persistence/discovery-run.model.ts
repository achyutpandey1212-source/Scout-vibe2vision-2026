import mongoose, { Schema, Document } from 'mongoose';

export interface IDiscoveryRun extends Document {
  startedAt: Date;
  finishedAt: Date;
  targetAudience: string;
  categories: string[];
  totalQueries: number;
  inserted: number;
  updated: number;
  failures: number;
  duration: number; // in seconds
  // V2 Expanded Metrics
  metricsByEcosystem?: Map<string, number>;
  metricsByOrgSize?: Map<string, number>;
  metricsByLocation?: Map<string, number>;
  metricsByDomain?: Map<string, number>;
  metricsByHiddenGem?: Map<string, number>;
  metricsBySuitability?: Map<string, number>;
  // V2 Health Indicators
  searchDiversityScore?: number;
  sourceDiversityScore?: number;
  opportunityDiversityScore?: number;
  locationDiversityScore?: number;
  engineeringDiversityScore?: number;
  studentCoverageScore?: number;
  // V2 Logging highlights
  highlights?: {
    topEcosystems: string[];
    topCities: string[];
    topDomains: string[];
    topEngineeringFields: string[];
    topOpportunityTypes: string[];
    topStartupEcosystems: string[];
    topUniversities: string[];
    topGovernmentOrganizations: string[];
  };
}

const DiscoveryRunSchema = new Schema<IDiscoveryRun>(
  {
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, required: true },
    targetAudience: { type: String, required: true },
    categories: [{ type: String }],
    totalQueries: { type: Number, required: true },
    inserted: { type: Number, required: true },
    updated: { type: Number, required: true },
    failures: { type: Number, required: true },
    duration: { type: Number, required: true },
    // V2 Expanded Metrics
    metricsByEcosystem: { type: Map, of: Number },
    metricsByOrgSize: { type: Map, of: Number },
    metricsByLocation: { type: Map, of: Number },
    metricsByDomain: { type: Map, of: Number },
    metricsByHiddenGem: { type: Map, of: Number },
    metricsBySuitability: { type: Map, of: Number },
    // V2 Health Indicators
    searchDiversityScore: { type: Number, default: 0 },
    sourceDiversityScore: { type: Number, default: 0 },
    opportunityDiversityScore: { type: Number, default: 0 },
    locationDiversityScore: { type: Number, default: 0 },
    engineeringDiversityScore: { type: Number, default: 0 },
    studentCoverageScore: { type: Number, default: 0 },
    // V2 Logging highlights
    highlights: {
      topEcosystems: [{ type: String }],
      topCities: [{ type: String }],
      topDomains: [{ type: String }],
      topEngineeringFields: [{ type: String }],
      topOpportunityTypes: [{ type: String }],
      topStartupEcosystems: [{ type: String }],
      topUniversities: [{ type: String }],
      topGovernmentOrganizations: [{ type: String }],
    },
  },
  {
    timestamps: true,
  },
);

export const DiscoveryRunModel =
  mongoose.models.DiscoveryRun || mongoose.model<IDiscoveryRun>('DiscoveryRun', DiscoveryRunSchema);

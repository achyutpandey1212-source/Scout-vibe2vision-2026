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
  },
  {
    timestamps: true,
  },
);

export const OpportunityModel =
  mongoose.models.Opportunity || mongoose.model<IOpportunity>('Opportunity', OpportunitySchema);

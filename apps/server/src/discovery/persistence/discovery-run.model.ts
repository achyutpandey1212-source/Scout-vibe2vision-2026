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
  },
  {
    timestamps: true,
  },
);

export const DiscoveryRunModel =
  mongoose.models.DiscoveryRun || mongoose.model<IDiscoveryRun>('DiscoveryRun', DiscoveryRunSchema);

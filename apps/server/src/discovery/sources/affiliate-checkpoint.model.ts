import mongoose, { Schema, Document } from 'mongoose';

export interface IAffiliateCheckpoint {
  key: string;
  status: 'idle' | 'running' | 'paused' | 'completed';
  lastProcessedUrl?: string | null;
  totalProcessed: number;
  approvedCount: number;
  rejectedCount: number;
  duplicateCount: number;
  updatedAt: Date;
}

export interface IAffiliateCheckpointDocument extends IAffiliateCheckpoint, Document {}

const AffiliateCheckpointSchema = new Schema<IAffiliateCheckpointDocument>(
  {
    key: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['idle', 'running', 'paused', 'completed'],
      default: 'idle',
    },
    lastProcessedUrl: { type: String, default: null },
    totalProcessed: { type: Number, default: 0 },
    approvedCount: { type: Number, default: 0 },
    rejectedCount: { type: Number, default: 0 },
    duplicateCount: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

export const AffiliateCheckpointModel =
  mongoose.models.AffiliateCheckpoint ||
  mongoose.model<IAffiliateCheckpointDocument>('AffiliateCheckpoint', AffiliateCheckpointSchema);

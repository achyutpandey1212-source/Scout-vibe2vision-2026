import mongoose, { Schema, Document } from 'mongoose';

export interface IQueryYield {
  query: string;
  runs: number;
  opportunitiesAccepted: number;
  yieldRate: number;
  lastRunAt: Date;
}

export interface IQueryYieldDocument extends IQueryYield, Document {}

const QueryYieldSchema = new Schema<IQueryYieldDocument>(
  {
    query: { type: String, required: true, unique: true, index: true },
    runs: { type: Number, default: 0 },
    opportunitiesAccepted: { type: Number, default: 0 },
    yieldRate: { type: Number, default: 0 },
    lastRunAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

QueryYieldSchema.pre('save', function (this: any, next: any) {
  this.yieldRate = this.runs > 0 ? this.opportunitiesAccepted / this.runs : 0;
  next();
});

export const QueryYieldModel =
  mongoose.models.QueryYield || mongoose.model<IQueryYieldDocument>('QueryYield', QueryYieldSchema);

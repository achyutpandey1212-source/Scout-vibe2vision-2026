import mongoose, { Schema, Document } from 'mongoose';

export interface IRawPage extends Document {
  url: string;
  title: string;
  markdown: string;
  metadata: Record<string, any>;
  crawledAt: Date;
  hash: string;
}

const RawPageSchema = new Schema<IRawPage>({
  url: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  markdown: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  crawledAt: { type: Date, default: Date.now },
  hash: { type: String, required: true },
});

export const RawPageModel =
  mongoose.models.RawPage || mongoose.model<IRawPage>('RawPage', RawPageSchema);

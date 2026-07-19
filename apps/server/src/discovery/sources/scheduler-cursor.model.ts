import mongoose, { Schema, Document } from 'mongoose';

export interface ISchedulerCursor {
  key: string;
  cursorIndex: number;
  lastProcessedSourceId?: mongoose.Types.ObjectId | null;
  updatedAt: Date;
}

export interface ISchedulerCursorDocument extends ISchedulerCursor, Document {}

const SchedulerCursorSchema = new Schema<ISchedulerCursorDocument>(
  {
    key: { type: String, required: true, unique: true, index: true },
    cursorIndex: { type: Number, required: true, default: 0 },
    lastProcessedSourceId: { type: Schema.Types.ObjectId, default: null },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

export const SchedulerCursorModel =
  mongoose.models.SchedulerCursor ||
  mongoose.model<ISchedulerCursorDocument>('SchedulerCursor', SchedulerCursorSchema);

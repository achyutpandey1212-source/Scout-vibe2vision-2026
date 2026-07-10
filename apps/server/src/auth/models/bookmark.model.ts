import mongoose, { Schema, Document } from 'mongoose';

export interface IBookmark extends Document {
  userId: mongoose.Types.ObjectId;
  opportunityId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity', required: true },
  createdAt: { type: Date, default: Date.now },
});

BookmarkSchema.index({ userId: 1, opportunityId: 1 }, { unique: true });

export const BookmarkModel =
  mongoose.models.Bookmark || mongoose.model<IBookmark>('Bookmark', BookmarkSchema);
export default BookmarkModel;

import mongoose, { Schema, Document } from 'mongoose';
import { ScoutUser } from '../types/auth.types';

export interface IUser extends ScoutUser, Document {}

const UserSchema = new Schema<IUser>(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    displayName: {
      type: String,
      default: '',
    },
    photoURL: {
      type: String,
      default: null,
    },
    provider: {
      type: String,
      default: 'google.com',
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      default: 'USER',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'DELETED', 'PENDING'],
      default: 'ACTIVE',
      index: true,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

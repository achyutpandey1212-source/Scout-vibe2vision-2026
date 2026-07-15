import { Request } from 'express';
import { Document } from 'mongoose';

export interface FirebaseClaims {
  uid: string;
  email: string;
  name: string;
  picture: string | null;
  emailVerified: boolean;
  provider: string;
}

export interface ScoutUser {
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  provider: string;
  emailVerified: boolean;
  isActive: boolean;
  role: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED' | 'PENDING';
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
  lastSeenAt?: Date;
}

export interface AuthenticatedRequest extends Request {
  auth?: FirebaseClaims;
  dbUser?: ScoutUser & Document;
}

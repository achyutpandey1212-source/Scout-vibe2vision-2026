import { IOpportunity } from '../../../discovery/extraction/models/opportunity.model';
import mongoose from 'mongoose';

export interface ICandidatePoolEntry {
  opportunity: IOpportunity;
  matchedBranch?: string;
  matchedYear?: string;
  matchedEducation?: string;
  passedFilters: string[];
}

export interface IRejectedCandidateEntry {
  opportunityId: mongoose.Types.ObjectId;
  title: string;
  organization: string;
  rejectionReason: string;
}

export interface IFilterStageReport {
  stage: string;
  beforeCount: number;
  afterCount: number;
  removedCount: number;
  removedPercentage: number;
}

export interface ICandidateFilterReport {
  initialCount: number;
  stages: IFilterStageReport[];
  finalCount: number;
  rejectedCandidates: IRejectedCandidateEntry[];
}

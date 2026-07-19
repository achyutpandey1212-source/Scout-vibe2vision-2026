import {
  OpportunityModel,
  IOpportunity,
} from '../../../discovery/extraction/models/opportunity.model';

export class CandidateRetrievalService {
  /**
   * Fetches all ACTIVE, PUBLIC, and non-archived opportunities from the database.
   */
  static async fetchActiveCandidates(): Promise<IOpportunity[]> {
    return OpportunityModel.find({
      status: 'ACTIVE',
      visibility: 'PUBLIC',
      archived: { $ne: true },
    }).exec();
  }
}

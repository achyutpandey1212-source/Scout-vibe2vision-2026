import {
  OpportunityModel,
  IOpportunity,
} from '../../discovery/extraction/models/opportunity.model';
import { Opportunity } from '../../discovery/extraction/types/opportunity.types';

export class IntelligenceRepository {
  /**
   * Loads opportunities requiring intelligence pipeline execution.
   * If force is true, loads all opportunities.
   * If force is false, loads only opportunities whose intelligence is null or version !== currentVersion.
   */
  static async loadPending(
    batchSize: number,
    currentVersion: string,
    force: boolean,
  ): Promise<IOpportunity[]> {
    const query = force
      ? {}
      : {
          $or: [{ intelligence: null }, { 'intelligence.version': { $ne: currentVersion } }],
        };

    return await OpportunityModel.find(query).limit(batchSize);
  }

  /**
   * Updates a single opportunity document.
   */
  static async updateOpportunity(id: string, opp: Opportunity): Promise<void> {
    await OpportunityModel.findByIdAndUpdate(id, { $set: opp });
  }

  /**
   * Performs a bulk write update of opportunities in MongoDB using Mongoose bulkWrite.
   */
  static async bulkUpdate(updates: { id: string; opportunity: Opportunity }[]): Promise<void> {
    if (updates.length === 0) return;

    const operations = updates.map((update) => ({
      updateOne: {
        filter: { _id: update.id },
        update: { $set: update.opportunity },
      },
    }));

    await OpportunityModel.bulkWrite(operations);
  }
}

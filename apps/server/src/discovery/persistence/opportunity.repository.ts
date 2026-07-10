import { Opportunity } from '../extraction/types/opportunity.types';
import { OpportunityModel } from '../extraction/models/opportunity.model';

/**
 * Handles database persistence operations, preventing duplicate records,
 * and standardizing upsert/content-hash checks.
 */
export class OpportunityRepository {
  /**
   * Upserts a list of opportunities, matching existing records by sourceURL.
   * Compares the MD5/SHA256 hashes to log if records are updated, inserted, or unchanged.
   */
  static async upsertOpportunities(
    opportunities: Opportunity[],
  ): Promise<{ inserted: number; updated: number; unchanged: number }> {
    let inserted = 0;
    let updated = 0;
    let unchanged = 0;

    for (const opp of opportunities) {
      try {
        // Query database by sourceURL or applicationUrl to check for existing record
        const existing = await OpportunityModel.findOne({
          $or: [{ sourceURL: opp.sourceURL }, { applicationUrl: opp.applicationUrl }],
        });

        if (!existing) {
          // Record does not exist: Insert new
          const modelObj = {
            ...opp,
            rawPageId: opp.rawPageId, // maps cleanly
          };
          await OpportunityModel.create(modelObj);
          inserted++;
        } else {
          // Record exists: Compare content hashes
          if (existing.hash !== opp.hash) {
            // Content has changed: Update existing record
            const updateObj = {
              ...opp,
              rawPageId: opp.rawPageId,
            };
            await OpportunityModel.updateOne({ _id: existing._id }, { $set: updateObj });
            updated++;
          } else {
            // Content is identical: Do nothing
            unchanged++;
          }
        }
      } catch (err: any) {
        console.error(
          `[Repository Error] Failed to upsert opportunity ${opp.sourceURL}:`,
          err.message,
        );
      }
    }

    return {
      inserted,
      updated,
      unchanged,
    };
  }
}

import { OpportunityModel } from '../extraction/models/opportunity.model';

export class OpportunityArchiver {
  /**
   * Scans all active opportunities in MongoDB.
   * If an opportunity's deadline date is in the past, marks it as archived and expired.
   */
  static async archiveExpired(): Promise<number> {
    console.log('[Archiver] Starting scan for expired opportunities...');
    const now = new Date();
    let archivedCount = 0;

    try {
      // Find all opportunities that are not archived yet and have a deadline
      const activeOpps = await OpportunityModel.find({
        archived: { $ne: true },
        deadline: { $ne: null, $exists: true },
      });

      for (const opp of activeOpps) {
        if (!opp.deadline || opp.deadline.toLowerCase() === 'flexible') continue;

        const deadlineDate = new Date(opp.deadline);
        // Check if parsing yielded a valid date and if that date has passed
        if (!isNaN(deadlineDate.getTime()) && deadlineDate < now) {
          await OpportunityModel.updateOne(
            { _id: opp._id },
            {
              $set: {
                archived: true,
                'intelligence.expired': true,
              },
            },
          );
          archivedCount++;
        }
      }

      if (archivedCount > 0) {
        console.log(`[Archiver] Successfully archived ${archivedCount} expired opportunities.`);
      } else {
        console.log('[Archiver] No expired opportunities found.');
      }
    } catch (err: any) {
      console.error('[Archiver] Failed to archive opportunities:', err.message);
    }

    return archivedCount;
  }
}

import { Opportunity } from '../extraction/types/opportunity.types';
import { OpportunityModel } from '../extraction/models/opportunity.model';
import { GoldOpportunityDetector } from '../intelligence/gold-opportunity-detector';
import { OpportunityScorer } from '../intelligence/opportunity-score';
import { CompanyExpander } from '../intelligence/company-expander';

export class OpportunityRepository {
  /**
   * Performs deduplication and merges candidate opportunities with existing records.
   * Compares source URLs, application links, or title-organization pairs.
   */
  static async upsertOpportunities(
    opportunities: Opportunity[],
  ): Promise<{ inserted: number; updated: number; unchanged: number; merged: number }> {
    let inserted = 0;
    const updated = 0;
    let unchanged = 0;
    let merged = 0;

    for (const opp of opportunities) {
      try {
        const titleLower = opp.title?.trim().toLowerCase();
        const orgLower = opp.organization?.trim().toLowerCase();

        // Compute opportunity intelligence scores & tiering
        const detection = GoldOpportunityDetector.detect(
          opp.organization || '',
          opp.sourceDomain || '',
        );
        const score = OpportunityScorer.score(opp, detection.tier);

        opp.goldOpportunity = detection.isGold;
        opp.companyTier = detection.tier;
        opp.opportunityScore = score.overall;
        opp.scoreBreakdown = score.signals;

        // 1. Query existing record by source URL, application link, or exact title + organization
        const existing = await OpportunityModel.findOne({
          $or: [
            { sourceURL: opp.sourceURL },
            { applicationUrl: opp.applicationUrl },
            {
              title: { $regex: new RegExp(`^${this.escapeRegExp(titleLower)}$`, 'i') },
              organization: { $regex: new RegExp(`^${this.escapeRegExp(orgLower)}$`, 'i') },
            },
          ],
        });

        if (!existing) {
          // Record does not exist: Create new
          const newDoc = {
            ...opp,
            discoveredAt: new Date(),
            firstSeenAt: new Date(),
            lastCheckedAt: new Date(),
            archived: false,
          };
          await OpportunityModel.create(newDoc);
          inserted++;

          // Async trigger related company expansions for accepted Tier 1/2 gold companies
          if (detection.isGold) {
            CompanyExpander.expand(detection.company).catch(() => {});
          }
        } else {
          // Record exists: Merge fields to keep the richest metadata
          let changed = false;

          // Standard non-array fields: update if new object has details and existing does not
          const fieldsToMerge: (keyof Opportunity)[] = [
            'description',
            'summary',
            'officialWebsite',
            'deadline',
            'startDate',
            'endDate',
            'salary',
            'stipend',
            'currency',
            'duration',
            'eligibility',
            'minimumQualification',
            'experienceLevel',
            'ageLimit',
            'genderEligibility',
            'selectionProcess',
            'benefits',
            'workMode',
            'fundingStatus',
            'visaSponsored',
            'travelFunded',
            'trustLevel',
          ];

          for (const field of fieldsToMerge) {
            const newVal = opp[field];
            const oldVal = existing[field];

            // If existing is falsy (or false) and new one has value, update
            if (
              (oldVal === null || oldVal === undefined || oldVal === '') &&
              newVal !== null &&
              newVal !== undefined &&
              newVal !== ''
            ) {
              (existing as any)[field] = newVal;
              changed = true;
            }
          }

          // Array fields: merge and deduplicate
          const arrayFields: (keyof Opportunity)[] = ['tags', 'skills', 'documentsRequired'];
          for (const field of arrayFields) {
            const newArr = opp[field] as string[];
            const oldArr = existing[field] as string[];

            if (newArr && newArr.length > 0) {
              const combined = Array.from(new Set([...(oldArr || []), ...newArr]));
              if (combined.length !== (oldArr || []).length) {
                (existing as any)[field] = combined;
                changed = true;
              }
            }
          }

          // Keep highest quality score and corresponding breakdown
          if (opp.qualityScore && opp.qualityScore > (existing.qualityScore || 0)) {
            existing.qualityScore = opp.qualityScore;
            existing.qualityBreakdown = opp.qualityBreakdown as any;
            changed = true;
          }

          // Always update lastCheckedAt
          existing.lastCheckedAt = new Date() as any;

          if (changed) {
            await existing.save();
            merged++;
          } else {
            unchanged++;
          }
        }
      } catch (err: any) {
        console.error(
          `[Repository Error] Failed to upsert/merge opportunity ${opp.sourceURL || opp.title}:`,
          err.message,
        );
      }
    }

    return {
      inserted,
      updated,
      unchanged,
      merged,
    };
  }

  private static escapeRegExp(val: string): string {
    return val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

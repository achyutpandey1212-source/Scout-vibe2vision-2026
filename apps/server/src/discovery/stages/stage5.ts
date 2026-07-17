import { IPipelineStage } from './pipeline-stage.interface';
import { QualityEvaluatedOpportunity } from './stage4';
import { OpportunityModel } from '../extraction/models/opportunity.model';
import { DISCOVERY_CONFIG } from '../config/discovery.config';
import { DashboardStateInstance } from '../utils/dashboard-state';
import { Types } from 'mongoose';
import { OpportunityEnrichmentPipeline } from './enrichment-pipeline';

export interface RunAnalytics {
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
  urlsFound: number;
  crawledPages: number;
  detectorSkipped: number;
  aiProcessed: number;
  accepted: number;
  review: number;
  rejected: number;
  inserted: number;
  updated: number;
  duplicatesMerged: number;
  archived: number;
  averageQuality: number;
  geminiCalls: number;
  groqCalls: number;
  cacheHits: number;
  failures: number;
}

export class Stage5Persistence implements IPipelineStage<
  QualityEvaluatedOpportunity[],
  RunAnalytics
> {
  /**
   * Safe URL normalization for duplicate matching
   */
  private normalizeUrl(urlStr: string | null | undefined): string {
    if (!urlStr) return '';
    try {
      const url = new URL(urlStr);
      url.search = '';
      url.hash = '';
      let pathname = url.pathname;
      if (pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
      }
      return `${url.protocol}//${url.hostname}${pathname}`;
    } catch {
      return urlStr.toLowerCase().trim();
    }
  }

  /**
   * Normalize organization name to match variations (e.g. Google India vs Google)
   */
  private normalizeOrg(org: string | null | undefined): string {
    if (!org) return '';
    return org
      .toLowerCase()
      .replace(/\b(llc|ltd|inc|corp|corporation|india|pvt|private)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculates similarity Jaccard token overlap between two titles
   */
  private titleSimilarity(t1: string, t2: string): number {
    const w1 = new Set(t1.toLowerCase().split(/\s+/).filter(Boolean));
    const w2 = new Set(t2.toLowerCase().split(/\s+/).filter(Boolean));
    const intersection = new Set([...w1].filter((x) => w2.has(x)));
    const union = new Set([...w1, ...w2]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  async execute(
    opportunities: QualityEvaluatedOpportunity[],
    options?: any,
  ): Promise<RunAnalytics> {
    const startedAt = options?.startedAt || new Date();
    console.log(
      `[Stage 5] Persisting & Deduplicating ${opportunities.length} evaluated opportunities...`,
    );

    DashboardStateInstance.updateState({ currentStage: 'STAGE_5_PERSISTENCE' });

    // 1. Acceptance Filter: filter out REJECT status items
    const candidates = opportunities.filter(
      (o) => o.decision === 'ACCEPT' || o.decision === 'REVIEW',
    );
    const rejectedCount = opportunities.filter((o) => o.decision === 'REJECT').length;
    const acceptedCount = opportunities.filter((o) => o.decision === 'ACCEPT').length;
    const reviewCount = opportunities.filter((o) => o.decision === 'REVIEW').length;

    let inserted = 0;
    let updated = 0;
    let duplicatesMerged = 0;
    let failures = 0;

    // Fetch SourceRegistry docs cache to resolve metadata easily
    const { SourceRegistryModel } = await import('../sources/source-registry.model');
    const sourceDocs = await SourceRegistryModel.find().lean();
    const sourceMap = new Map(sourceDocs.map((s: any) => [s.domain, s]));

    // Fetch existing records from MongoDB for in-memory deduplication comparison
    const existingRecords = await OpportunityModel.find({ archived: { $ne: true } });
    console.log(`[Stage 5] Fetched ${existingRecords.length} existing records from database.`);

    const bulkOps: any[] = [];

    for (const opp of candidates) {
      try {
        let bestMatch: any = null;
        let highestConfidence = 0;

        const candidateAppUrl = this.normalizeUrl(opp.applicationUrl);
        const candidateSourceUrl = this.normalizeUrl(opp.sourceURL);
        const candidateOrg = this.normalizeOrg(opp.organization);

        // ── Phase 9/11: Run Deterministic Enrichment on the opportunity profile ──
        const domain = opp.sourceURL
          ? opp.sourceURL
              .toLowerCase()
              .replace(/^https?:\/\/(www\.)?/, '')
              .split('/')[0]
          : '';
        const sourceDoc = sourceMap.get(domain);
        const enrichmentPipeline = new OpportunityEnrichmentPipeline();
        enrichmentPipeline.enrich(opp, sourceDoc);

        // ── Phase 10: Relationship Graph construction ──
        const similarIds: string[] = [];
        const sameOrgIds: string[] = [];
        const sameDomainIds: string[] = [];
        const sameSkillsIds: string[] = [];

        for (const existing of existingRecords) {
          const existingId = existing._id.toString();
          const existingOrg = this.normalizeOrg(existing.organization);
          if (existingOrg === candidateOrg) {
            sameOrgIds.push(existingId);
          }
          if (this.titleSimilarity(opp.title, existing.title) > 0.4) {
            similarIds.push(existingId);
          }
          if (
            opp.domains &&
            existing.domains &&
            opp.domains.some((d: string) => existing.domains.includes(d))
          ) {
            sameDomainIds.push(existingId);
          }
          if (
            opp.skills &&
            existing.skills &&
            opp.skills.some((s: string) => existing.skills.includes(s))
          ) {
            sameSkillsIds.push(existingId);
          }
        }
        opp.relatedSimilar = similarIds.slice(0, 5);
        opp.relatedSameOrg = sameOrgIds.slice(0, 5);
        opp.relatedSameDomain = sameDomainIds.slice(0, 5);
        opp.relatedSameSkills = sameSkillsIds.slice(0, 5);

        for (const existing of existingRecords) {
          let confidence = 0;

          const existingAppUrl = this.normalizeUrl(existing.applicationUrl);
          const existingSourceUrl = this.normalizeUrl(existing.sourceURL);
          const existingOrg = this.normalizeOrg(existing.organization);

          // Matching logic rules
          if (candidateAppUrl && existingAppUrl && candidateAppUrl === existingAppUrl) {
            console.log(`[Deduplication Match] AppUrl match: ${candidateAppUrl}`);
            confidence = 100;
          } else if (
            candidateSourceUrl &&
            existingSourceUrl &&
            candidateSourceUrl === existingSourceUrl
          ) {
            console.log(`[Deduplication Match] SourceUrl match: ${candidateSourceUrl}`);
            confidence = 100;
          } else if (candidateOrg === existingOrg) {
            const similarity = this.titleSimilarity(opp.title, existing.title);
            if (similarity > 0.85) {
              confidence = 96;
            } else if (similarity > 0.7 && opp.deadline === existing.deadline) {
              confidence = 90;
            }
          }

          if (confidence > highestConfidence) {
            highestConfidence = confidence;
            bestMatch = existing;
          }
        }

        const mergeThreshold = options?.MERGE_THRESHOLD || 95;
        const reviewThreshold = options?.REVIEW_THRESHOLD || 80;

        if (bestMatch && highestConfidence >= mergeThreshold) {
          // Rule-based merge into existing record
          duplicatesMerged++;

          const updateFields: any = {
            lastCheckedAt: new Date(),
            updatedAt: new Date(),
          };

          // Overwrite with richer description
          if ((opp.description?.length || 0) > (bestMatch.description?.length || 0)) {
            updateFields.description = opp.description;
            updateFields.summary = opp.summary;
          }

          // Non-null field upgrades
          const mergeKeys: (keyof QualityEvaluatedOpportunity)[] = [
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
            'benefits',
            'workMode',
            'fundingStatus',
          ];

          for (const key of mergeKeys) {
            if (!bestMatch[key] && opp[key]) {
              updateFields[key] = opp[key];
            }
          }

          // Set higher quality score
          if (opp.qualityScore > (bestMatch.qualityScore || 0)) {
            updateFields.qualityScore = opp.qualityScore;
            updateFields.qualityBreakdown = opp.qualityBreakdown;
          }

          // Accumulate tags & skills arrays
          if (opp.tags && opp.tags.length > 0) {
            updateFields.tags = Array.from(new Set([...(bestMatch.tags || []), ...opp.tags]));
          }
          if (opp.skills && opp.skills.length > 0) {
            updateFields.skills = Array.from(new Set([...(bestMatch.skills || []), ...opp.skills]));
          }

          // Push update task to bulk operation queue
          bulkOps.push({
            updateOne: {
              filter: { _id: bestMatch._id },
              update: { $set: updateFields },
            },
          });
          updated++;
        } else {
          // No match: Add as a new opportunity doc, but use upsert to prevent E11000 duplicates
          const filterUrl =
            opp.applicationUrl || opp.sourceURL || `empty_url_${new Types.ObjectId()}`;
          const filter = { applicationUrl: filterUrl };
          const updateFields: any = {
            ...opp,
            lastCheckedAt: new Date(),
            updatedAt: new Date().toISOString(),
            archived: false,
          };

          bulkOps.push({
            updateOne: {
              filter,
              update: {
                $setOnInsert: {
                  discoveredAt: new Date(),
                  firstSeenAt: new Date(),
                  createdAt: new Date().toISOString(),
                  intelligence: {
                    normalizedOrganization: opp.organization,
                    normalizedDeadline: opp.deadline,
                    daysRemaining: null,
                    expired: false,
                    metadata: null,
                    version: 'v2',
                    enriched: false,
                    lastEnrichedAt: null,
                  },
                },
                $set: updateFields,
              },
              upsert: true,
            },
          });
          inserted++;
        }
      } catch (err: any) {
        failures++;
        console.error(`[Stage 5] Deduplication comparison failure:`, err.message);
      }
    }

    // 2. Persistence execution: Run bulkWrite
    if (bulkOps.length > 0) {
      try {
        const result = await OpportunityModel.bulkWrite(bulkOps, { ordered: false });
        console.log(
          `[Stage 5] Database BulkWrite executed successfully with ${bulkOps.length} operations.`,
        );
        inserted = result.upsertedCount || 0;
        updated = result.modifiedCount || 0;
      } catch (bulkErr: any) {
        console.error(
          `[Stage 5] BulkWrite execution encountered errors (safely handled):`,
          bulkErr.message,
        );
        if (bulkErr.result) {
          inserted = bulkErr.result.nUpserted || bulkErr.result.upsertedCount || 0;
          updated = bulkErr.result.nModified || bulkErr.result.modifiedCount || 0;
        }
      }
    }

    // 3. Archive Engine execution: Archive expired opportunities
    let archived = 0;
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      // A. Update records where intelligence object is null or missing
      await OpportunityModel.updateMany(
        {
          deadline: { $lt: todayStr },
          archived: { $ne: true },
          $or: [{ intelligence: null }, { intelligence: { $exists: false } }],
        },
        {
          $set: {
            archived: true,
            intelligence: {
              normalizedOrganization: '',
              normalizedDeadline: '',
              daysRemaining: null,
              expired: true,
              metadata: null,
              version: 'v2',
              enriched: false,
              lastEnrichedAt: null,
            },
          },
        },
      );

      // B. Update records where intelligence object exists
      const archiveResult = await OpportunityModel.updateMany(
        {
          deadline: { $lt: todayStr },
          archived: { $ne: true },
          intelligence: { $ne: null },
        },
        {
          $set: {
            archived: true,
            'intelligence.expired': true,
          },
        },
      );
      archived = archiveResult.modifiedCount;
      console.log(
        `[Stage 5] [Archive Engine] Scan complete. Archived ${archived} expired opportunities.`,
      );
    } catch (archiveErr: any) {
      console.error(`[Stage 5] [Archive Engine] Failed:`, archiveErr.message);
    }

    // ─── Phase 9: Source Feedback Loop ───────────────────────────────────
    try {
      const { SourceRegistryModel } = await import('../sources/source-registry.model');
      const feedbackByDomain: Record<
        string,
        {
          totalFound: number;
          acceptedCount: number;
          qualityScores: number[];
          hiddenGemScores: number[];
        }
      > = {};

      for (const opp of opportunities) {
        if (!opp.sourceURL) continue;
        const domain = opp.sourceURL
          .toLowerCase()
          .replace(/^https?:\/\/(www\.)?/, '')
          .split('/')[0];
        if (!domain) continue;

        if (!feedbackByDomain[domain]) {
          feedbackByDomain[domain] = {
            totalFound: 0,
            acceptedCount: 0,
            qualityScores: [],
            hiddenGemScores: [],
          };
        }

        const fb = feedbackByDomain[domain];
        fb.totalFound++;
        if (opp.decision === 'ACCEPT' || opp.decision === 'REVIEW') {
          fb.acceptedCount++;
          fb.qualityScores.push(opp.qualityScore || 0);
          const hgScore =
            (opp as any).hiddenGemScore || (opp as any).intelligence?.hiddenGemScore || 0;
          fb.hiddenGemScores.push(hgScore);
        }
      }

      for (const [domain, fb] of Object.entries(feedbackByDomain)) {
        const source = await SourceRegistryModel.findOne({ domain });
        if (!source) continue;

        const prevTotal = source.totalOpportunitiesFound || 0;
        const newTotal = prevTotal + fb.acceptedCount;

        const updateData: any = {
          totalOpportunitiesFound: newTotal,
        };

        if (fb.qualityScores.length > 0) {
          const avgQual = fb.qualityScores.reduce((a, b) => a + b, 0) / fb.qualityScores.length;
          const currentAvgQual = source.averageOpportunityQuality || 0;
          updateData.averageOpportunityQuality =
            currentAvgQual > 0 ? Math.round((currentAvgQual + avgQual) / 2) : Math.round(avgQual);
        }

        if (fb.hiddenGemScores.length > 0) {
          const avgHG = fb.hiddenGemScores.reduce((a, b) => a + b, 0) / fb.hiddenGemScores.length;
          const currentAvgHG = source.averageHiddenGemScore || 0;
          updateData.averageHiddenGemScore =
            currentAvgHG > 0 ? Math.round((currentAvgHG + avgHG) / 2) : Math.round(avgHG);
        }

        if (fb.acceptedCount > 0) {
          updateData.freshnessScore = Math.min(100, (source.freshnessScore || 50) + 10);
          if ((updateData.averageOpportunityQuality || 0) >= 80) {
            updateData.discoveryValue = Math.min(100, (source.discoveryValue || 50) + 5);
          }
        } else {
          updateData.freshnessScore = Math.max(0, (source.freshnessScore || 50) - 5);
          updateData.discoveryValue = Math.max(0, (source.discoveryValue || 50) - 2);
        }

        if (updateData.discoveryValue < 30 || updateData.freshnessScore < 20) {
          updateData.priority = 'low';
        }

        await SourceRegistryModel.updateOne({ domain }, { $set: updateData });
      }
    } catch (feedbackErr: any) {
      console.error(`[Stage 5] Source Feedback Loop failed:`, feedbackErr.message);
    }

    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();

    // Calculate average quality score
    const totalQuality = candidates.reduce((sum, o) => sum + (o.qualityScore || 0), 0);
    const averageQuality =
      candidates.length > 0 ? Math.round((totalQuality / candidates.length) * 10) / 10 : 0;

    const runAnalytics: RunAnalytics = {
      startedAt,
      finishedAt,
      durationMs,
      urlsFound: options?.urlsFound || 0,
      crawledPages: options?.crawledPages || 0,
      detectorSkipped: options?.detectorSkipped || 0,
      aiProcessed: options?.aiProcessed || 0,
      accepted: acceptedCount,
      review: reviewCount,
      rejected: rejectedCount,
      inserted,
      updated,
      duplicatesMerged,
      archived,
      averageQuality,
      geminiCalls: options?.geminiCalls || 0,
      groqCalls: options?.groqCalls || 0,
      cacheHits: options?.cacheHits || 0,
      failures,
    };

    // Update dashboard metrics
    DashboardStateInstance.updateState({
      isRunning: false,
      currentStage: 'IDLE',
      inserted: DashboardStateInstance.getState().inserted + inserted,
      updated: DashboardStateInstance.getState().updated + updated,
      archived: DashboardStateInstance.getState().archived + archived,
      failures: DashboardStateInstance.getState().failures + failures,
    });

    return runAnalytics;
  }
}

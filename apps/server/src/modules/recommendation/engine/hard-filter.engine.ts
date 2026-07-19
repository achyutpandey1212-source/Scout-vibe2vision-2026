import { IOpportunity } from '../../../discovery/extraction/models/opportunity.model';
import { IProfile } from '../../../profile/models/profile.model';
import {
  ICandidatePoolEntry,
  ICandidateFilterReport,
  IRejectedCandidateEntry,
  IFilterStageReport,
} from '../types/candidate-pool.types';
import { CountryCompatibilityService } from '../service/country-compatibility.service';
import mongoose from 'mongoose';

export class HardFilterEngine {
  /**
   * Helper to add a stage report to the main report object.
   */
  private static addStageReport(
    report: ICandidateFilterReport,
    stageName: string,
    beforeCount: number,
    afterCount: number,
  ) {
    const removedCount = beforeCount - afterCount;
    const removedPercentage = beforeCount > 0 ? Math.round((removedCount / beforeCount) * 100) : 0;
    report.stages.push({
      stage: stageName,
      beforeCount,
      afterCount,
      removedCount,
      removedPercentage,
    });
  }

  /**
   * Helper to log rejection to the report.
   */
  private static reject(report: ICandidateFilterReport, op: IOpportunity, reason: string) {
    report.rejectedCandidates.push({
      opportunityId: op._id as mongoose.Types.ObjectId,
      title: op.title,
      organization: op.organization,
      rejectionReason: reason,
    });
  }

  /**
   * Filter 1: Deadline Filter
   */
  static filterDeadline(
    candidates: IOpportunity[],
    report: ICandidateFilterReport,
  ): IOpportunity[] {
    const beforeCount = candidates.length;
    const now = new Date();

    const filtered = candidates.filter((op) => {
      // Reject if deadlineStatus is EXPIRED
      if (op.deadlineStatus === 'EXPIRED') {
        this.reject(report, op, 'EXPIRED_STATUS');
        return false;
      }

      // Reject if intelligence.expired is true
      if (op.intelligence?.expired === true) {
        this.reject(report, op, 'EXPIRED_INTELLIGENCE');
        return false;
      }

      // Parse date deadline if it exists and check if past
      if (
        op.deadline &&
        op.deadline.toLowerCase() !== 'rolling' &&
        op.deadline.toLowerCase() !== 'flexible'
      ) {
        const deadlineDate = new Date(op.deadline);
        if (!isNaN(deadlineDate.getTime()) && deadlineDate < now) {
          this.reject(report, op, 'EXPIRED_DATE');
          return false;
        }
      }

      return true;
    });

    this.addStageReport(report, 'Deadline Filter', beforeCount, filtered.length);
    return filtered;
  }

  /**
   * Filter 2: Country Filter
   */
  static filterCountry(candidates: IOpportunity[], report: ICandidateFilterReport): IOpportunity[] {
    const beforeCount = candidates.length;

    const filtered = candidates.filter((op) => {
      const compatible = CountryCompatibilityService.isCountryCompatible(op, 'India');
      if (!compatible) {
        this.reject(report, op, 'COUNTRY_MISMATCH');
      }
      return compatible;
    });

    this.addStageReport(report, 'Country Filter', beforeCount, filtered.length);
    return filtered;
  }

  /**
   * Filter 3: Visa Filter
   */
  static filterVisa(candidates: IOpportunity[], report: ICandidateFilterReport): IOpportunity[] {
    const beforeCount = candidates.length;

    const filtered = candidates.filter((op) => {
      const compatible = CountryCompatibilityService.isVisaCompatible(op, 'India');
      if (!compatible) {
        this.reject(report, op, 'VISA_RESTRICTION');
      }
      return compatible;
    });

    this.addStageReport(report, 'Visa Filter', beforeCount, filtered.length);
    return filtered;
  }

  /**
   * Filter 4: Branch Filter
   */
  static filterBranch(
    candidates: IOpportunity[],
    report: ICandidateFilterReport,
    profile: IProfile,
  ): IOpportunity[] {
    const beforeCount = candidates.length;
    const userBranch = (profile?.branch || '').trim();

    if (!userBranch) {
      this.addStageReport(report, 'Branch Filter', beforeCount, candidates.length);
      return [...candidates];
    }

    // Resolve Branch Synonyms
    const getBranchSynonyms = (branch: string): string[] => {
      const lower = branch.toLowerCase();
      if (
        lower.includes('computer science') ||
        lower.includes('cse') ||
        lower.includes('information technology') ||
        lower.includes('it') ||
        lower.includes('software')
      ) {
        return [
          'computer science',
          'cse',
          'computer engineering',
          'it',
          'information technology',
          'software engineering',
        ];
      }
      if (
        lower.includes('electronics') ||
        lower.includes('ece') ||
        lower.includes('electrical') ||
        lower.includes('telecommunication')
      ) {
        return [
          'ece',
          'electronics',
          'electronics & communication',
          'electrical',
          'telecommunication',
        ];
      }
      return [lower];
    };

    const userSynonyms = getBranchSynonyms(userBranch);

    const filtered = candidates.filter((op) => {
      const branches = op.eligibleBranches || [];
      if (branches.length === 0) return true; // Open to all branches

      const hasMatch = branches.some((branch) => {
        const branchLower = branch.toLowerCase();
        return userSynonyms.some((syn) => branchLower.includes(syn) || syn.includes(branchLower));
      });

      if (!hasMatch) {
        this.reject(report, op, 'BRANCH_MISMATCH');
      }
      return hasMatch;
    });

    this.addStageReport(report, 'Branch Filter', beforeCount, filtered.length);
    return filtered;
  }

  /**
   * Filter 5: Year Filter
   */
  static filterYear(
    candidates: IOpportunity[],
    report: ICandidateFilterReport,
    profile: IProfile,
  ): IOpportunity[] {
    const beforeCount = candidates.length;
    const userYear = profile?.currentYear;

    if (!userYear) {
      this.addStageReport(report, 'Year Filter', beforeCount, candidates.length);
      return [...candidates];
    }

    const filtered = candidates.filter((op) => {
      const eligibleYears = op.eligibleYears || [];
      if (eligibleYears.length === 0) return true; // Empty eligibleYears means open to all

      // Check suitable booleans first
      if (userYear === 1 && op.suitableFirstYear === false && eligibleYears.length > 0) {
        const match = eligibleYears.some((y) => /1st|first|year 1/i.test(y));
        if (!match) {
          this.reject(report, op, 'YEAR_MISMATCH');
          return false;
        }
      }
      if (userYear === 2 && op.suitableSecondYear === false && eligibleYears.length > 0) {
        const match = eligibleYears.some((y) => /2nd|second|year 2/i.test(y));
        if (!match) {
          this.reject(report, op, 'YEAR_MISMATCH');
          return false;
        }
      }
      if (userYear === 3 && op.suitableThirdYear === false && eligibleYears.length > 0) {
        const match = eligibleYears.some((y) => /3rd|third|year 3/i.test(y));
        if (!match) {
          this.reject(report, op, 'YEAR_MISMATCH');
          return false;
        }
      }
      if (userYear === 4 && op.suitableFourthYear === false && eligibleYears.length > 0) {
        const match = eligibleYears.some((y) => /4th|fourth|year 4/i.test(y));
        if (!match) {
          this.reject(report, op, 'YEAR_MISMATCH');
          return false;
        }
      }

      return true;
    });

    this.addStageReport(report, 'Year Filter', beforeCount, filtered.length);
    return filtered;
  }

  /**
   * Filter 6: Education Filter
   */
  static filterEducation(
    candidates: IOpportunity[],
    report: ICandidateFilterReport,
    profile: IProfile,
  ): IOpportunity[] {
    const beforeCount = candidates.length;
    const userDegree = (profile?.degree || '').toLowerCase();

    const filtered = candidates.filter((op) => {
      const minEducation = (op.minimumEducation || '').toLowerCase();
      if (!minEducation) return true;

      // Reject only definitive mismatches
      if (
        (minEducation.includes('phd') || minEducation.includes('doctorate')) &&
        !userDegree.includes('phd') &&
        !userDegree.includes('doctor')
      ) {
        this.reject(report, op, 'EDUCATION_MISMATCH_PHD');
        return false;
      }

      if (
        (minEducation.includes('masters') ||
          minEducation.includes('postgraduate') ||
          minEducation.includes('m.tech') ||
          minEducation.includes('mtech')) &&
        (userDegree.includes('b.tech') ||
          userDegree.includes('btech') ||
          userDegree.includes('bachelor') ||
          userDegree.includes('undergraduate'))
      ) {
        this.reject(report, op, 'EDUCATION_MISMATCH_MASTERS');
        return false;
      }

      return true;
    });

    this.addStageReport(report, 'Education Filter', beforeCount, filtered.length);
    return filtered;
  }

  /**
   * Filter 7: Basic Eligibility Filter
   */
  static filterEligibility(
    candidates: IOpportunity[],
    report: ICandidateFilterReport,
    profile: IProfile,
  ): IOpportunity[] {
    const beforeCount = candidates.length;
    const userGender = profile?.gender;
    const userAge = profile?.age;

    const filtered = candidates.filter((op) => {
      // Gender checks
      if (op.genderEligibility) {
        const genderReq = op.genderEligibility.toUpperCase();
        if (genderReq === 'FEMALE' && userGender === 'MALE') {
          this.reject(report, op, 'GENDER_MISMATCH');
          return false;
        }
      }

      if (op.womenFocused && userGender === 'MALE') {
        this.reject(report, op, 'GENDER_MISMATCH_WOMEN_ONLY');
        return false;
      }

      // Age limit check
      if (op.ageLimit && userAge && userAge > op.ageLimit) {
        this.reject(report, op, 'AGE_EXCEEDED');
        return false;
      }

      return true;
    });

    this.addStageReport(report, 'Eligibility Filter', beforeCount, filtered.length);
    return filtered;
  }

  /**
   * Executes the entire hard filtering pipeline.
   */
  static run(
    candidates: IOpportunity[],
    profile: IProfile,
  ): { pool: ICandidatePoolEntry[]; report: ICandidateFilterReport } {
    const report: ICandidateFilterReport = {
      initialCount: candidates.length,
      stages: [],
      finalCount: 0,
      rejectedCandidates: [],
    };

    let step = candidates;

    step = this.filterDeadline(step, report);
    step = this.filterCountry(step, report);
    step = this.filterVisa(step, report);
    step = this.filterBranch(step, report, profile);
    step = this.filterYear(step, report, profile);
    step = this.filterEducation(step, report, profile);
    step = this.filterEligibility(step, report, profile);

    report.finalCount = step.length;

    // Build the final candidate pool entries
    const pool: ICandidatePoolEntry[] = step.map((op) => ({
      opportunity: op,
      matchedBranch: profile?.branch,
      matchedYear: profile?.currentYear ? String(profile.currentYear) : undefined,
      matchedEducation: profile?.degree,
      passedFilters: ['DEADLINE', 'COUNTRY', 'VISA', 'BRANCH', 'YEAR', 'EDUCATION', 'ELIGIBILITY'],
    }));

    return { pool, report };
  }
}

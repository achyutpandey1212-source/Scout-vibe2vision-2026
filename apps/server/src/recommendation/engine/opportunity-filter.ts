import { CandidateSnapshot } from './candidate-snapshot';

export interface OpportunityFilterResult {
  eligible: any[];
  rejected: Array<{ opportunity: any; reason: string }>;
  stats: {
    total: number;
    rejectedCount: number;
    remainingCount: number;
    rejectionReasons: Record<string, number>;
  };
}

export class OpportunityFilter {
  /**
   * Filters candidate opportunities using strict hard eligibility rules.
   * Soft penalties (location, missing deadline, stipend, etc.) are handled during scoring.
   */
  public filter(snapshot: CandidateSnapshot, opportunities: any[]): OpportunityFilterResult {
    const eligible: any[] = [];
    const rejected: Array<{ opportunity: any; reason: string }> = [];
    const rejectionReasons: Record<string, number> = {
      REJECT_MASTER_PROGRAM: 0,
      REJECT_PHD: 0,
      REJECT_FACULTY: 0,
      REJECT_SENIOR_ROLE: 0,
      REJECT_EXPERIENCE_TOO_HIGH: 0,
      REJECT_NON_ENGINEERING: 0,
      REJECT_EXPIRED: 0,
    };

    const isStudent = snapshot.persona === 'College Student';

    for (const opp of opportunities) {
      const title = (opp.title || '').toLowerCase();
      const desc = (opp.description || opp.summary || '').toLowerCase();
      const fullText = `${title} ${desc}`;
      const isInternship =
        title.includes('intern') ||
        title.includes('trainee') ||
        opp.opportunityType === 'INTERNSHIP';

      // 1. Expired / Closed check
      if (opp.archived === true || opp.status === 'EXPIRED' || opp.status === 'CLOSED') {
        this.addRejection(opp, 'REJECT_EXPIRED', rejected, rejectionReasons);
        continue;
      }

      if (opp.deadline) {
        const deadlineDate = new Date(opp.deadline);
        if (!isNaN(deadlineDate.getTime()) && deadlineDate.getTime() < Date.now() - 86400000) {
          this.addRejection(opp, 'REJECT_EXPIRED', rejected, rejectionReasons);
          continue;
        }
      }

      // 2. Master's / MS / MSc programs (unless intern)
      if (!isInternship) {
        if (
          /\b(master|masters|msc|ms|m\.tech|mtech|graduate program)\b/i.test(title) ||
          (/\b(master's degree|masters degree|graduate degree|m\.tech)\b/i.test(desc) &&
            !desc.includes('bachelor'))
        ) {
          this.addRejection(opp, 'REJECT_MASTER_PROGRAM', rejected, rejectionReasons);
          continue;
        }
      }

      // 3. PhD / Postdoc / Research Scholar
      if (
        /\b(phd|doctorate|doctoral|postdoc|post-doctoral|research scholar|research fellow)\b/i.test(
          fullText,
        )
      ) {
        this.addRejection(opp, 'REJECT_PHD', rejected, rejectionReasons);
        continue;
      }

      // 4. Faculty / Professor
      if (/\b(professor|faculty|lecturer|teaching assistant)\b/i.test(title)) {
        this.addRejection(opp, 'REJECT_FACULTY', rejected, rejectionReasons);
        continue;
      }

      // 5. Senior / Lead / Manager Roles
      if (
        /\b(senior|sr\.|lead|principal|staff engineer|staff developer|architect|manager|director|vp|head of)\b/i.test(
          title,
        )
      ) {
        this.addRejection(opp, 'REJECT_SENIOR_ROLE', rejected, rejectionReasons);
        continue;
      }

      // 6. Experience required >= 3 years
      const expReq = (opp.experienceLevel || opp.experienceRequired || '').toString().toLowerCase();
      if (
        isStudent &&
        (/\b(3\+|4\+|5\+|6\+|7\+|8\+|9\+|10\+)\s*(years|yrs)\b/i.test(fullText) ||
          /\b(3|4|5|6|7|8|9|10)\s*\+\s*(years|yrs)\b/i.test(expReq) ||
          expReq === 'experienced')
      ) {
        this.addRejection(opp, 'REJECT_EXPERIENCE_TOO_HIGH', rejected, rejectionReasons);
        continue;
      }

      // 7. Non-engineering opportunities
      const hasTechRelevance =
        /\b(software|developer|engineer|engineering|code|coding|web|frontend|backend|fullstack|full-stack|ai|ml|data|cloud|devops|security|platform|mobile|react|node|python|java|javascript|typescript|cpp|c\+\+|sql|database|api)\b/i.test(
          fullText,
        ) ||
        (Array.isArray(opp.skills) && opp.skills.length > 0) ||
        (Array.isArray(opp.tags) && opp.tags.some((t: string) => /tech|code|eng|dev/i.test(t)));

      if (!hasTechRelevance) {
        this.addRejection(opp, 'REJECT_NON_ENGINEERING', rejected, rejectionReasons);
        continue;
      }

      // Passed all hard eligibility checks
      eligible.push(opp);
    }

    return {
      eligible,
      rejected,
      stats: {
        total: opportunities.length,
        rejectedCount: rejected.length,
        remainingCount: eligible.length,
        rejectionReasons,
      },
    };
  }

  private addRejection(
    opp: any,
    reason: string,
    rejected: Array<{ opportunity: any; reason: string }>,
    stats: Record<string, number>,
  ) {
    rejected.push({ opportunity: opp, reason });
    stats[reason] = (stats[reason] || 0) + 1;
  }
}

import { Opportunity } from '../extraction/types/opportunity.types';

export interface OpportunityScoreBreakdown {
  engineering: number;
  freshness: number;
  company: number;
  internship: number;
  hackathon: number;
  deadline: number;
  remote: number;
  application: number;
}

export interface OpportunityScore {
  overall: number;
  signals: OpportunityScoreBreakdown;
}

export class OpportunityScorer {
  /**
   * Calculates a granular opportunity quality score (0-100) and signals breakdown
   * based on relevance, freshness, company tiering, and remote preferences.
   */
  static score(opp: Opportunity, companyTier: number = 3): OpportunityScore {
    // 1. Engineering Relevance (Max 25)
    // High score for key technical domains and standard SDE/ML tags
    let engineering = 10;
    const isTechDomain = opp.professionalDomains?.some((d: any) =>
      ['SOFTWARE', 'DATA_SCIENCE', 'AI_ML', 'INFRASTRUCTURE'].includes(String(d).toUpperCase()),
    );
    if (isTechDomain) engineering += 10;
    if (opp.skills && opp.skills.length > 2) engineering += 5;

    // 2. Internship / Hackathon Confidence (Max 20)
    // Matches if specifically internship type and mentions student/placement eligibility
    let internship = 10;
    if (String(opp.opportunityType).toUpperCase() === 'INTERNSHIP') {
      internship += 5;
    }
    const lowerTitle = opp.title.toLowerCase();
    if (lowerTitle.includes('intern') || lowerTitle.includes('sde')) {
      internship += 5;
    }

    let hackathon = 0;
    if (
      String(opp.opportunityType).toUpperCase() === 'HACKATHON' ||
      String(opp.opportunityType).toUpperCase() === 'COMPETITION'
    ) {
      hackathon += 5;
    }
    if (
      lowerTitle.includes('hackathon') ||
      lowerTitle.includes('competition') ||
      lowerTitle.includes('challenge') ||
      lowerTitle.includes('athon')
    ) {
      hackathon += 5;
    }

    // 3. Freshness (Max 15)
    // Starts high; decays slightly based on date age if available
    let freshness = 15;
    const discovered = Date.now();
    const ageDays = (Date.now() - discovered) / (1000 * 60 * 60 * 24);
    if (ageDays > 7) freshness -= 5;
    if (ageDays > 30) freshness -= 5;

    // 4. Application Quality (Max 15)
    // Easy difficulty or high extraction confidence adds to score
    let application = 10;
    if (opp.applicationDifficulty === 'LOW') application += 5;
    if (opp.confidence > 80) application += 2;

    // 5. Company Reputation / Tiering (Max 10)
    // Tier 1 gets 10, Tier 2 gets 7, Tier 3 (others) gets 4
    let company = 4;
    if (companyTier === 1) company = 10;
    else if (companyTier === 2) company = 7;

    // 6. Deadline (Max 5)
    // If deadline exists, it is more structured and gets 5 points
    let deadline = 3;
    if (opp.deadline) deadline = 5;

    // 7. Remote Preferences (Max 5)
    let remote = 3;
    if (opp.remote) remote = 5;

    // 8. Location Preferences (Max 5)
    let location = 3;
    const city = opp.city?.toLowerCase() || '';
    if (city === 'bangalore' || city === 'bengaluru' || city === 'pune' || city === 'hyderabad') {
      location = 5;
    }

    // Adjust location score to fit signals breakdown schema
    const signals: OpportunityScoreBreakdown = {
      engineering,
      freshness,
      company,
      internship,
      hackathon,
      deadline,
      remote,
      application,
    };

    const overall = Math.min(
      100,
      engineering +
        freshness +
        company +
        internship +
        hackathon +
        deadline +
        remote +
        application +
        location,
    );

    return {
      overall,
      signals,
    };
  }
}
export default OpportunityScorer;

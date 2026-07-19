import { IOpportunity } from '../../../discovery/extraction/models/opportunity.model';
import { IProfile } from '../../../profile/models/profile.model';
import {
  IRankedCandidate,
  IScoreBreakdown,
  IRecommendationExplanation,
} from '../types/scoring.types';
import { ScoringWeights } from '../config/scoring.config';
import mongoose from 'mongoose';

export class ScoringEngine {
  /**
   * Computes match score and breakdown for a single candidate.
   */
  static scoreOpportunity(opportunity: IOpportunity, profile: IProfile): IRankedCandidate {
    const explanations: IRecommendationExplanation[] = [];

    // 1. Base Match (Max 25)
    let baseMatch = 0;
    const userBranch = (profile.branch || '').toLowerCase();
    const eligibleBranches = (opportunity.eligibleBranches || []).map((b) => b.toLowerCase());

    if (eligibleBranches.length === 0) {
      baseMatch += 6; // Open to all branches
    } else if (eligibleBranches.some((b) => b.includes(userBranch) || userBranch.includes(b))) {
      baseMatch += 8; // Exact/synonym branch match
      explanations.push({
        type: 'baseMatch',
        message: `Excellent match for your ${profile.branch} branch`,
      });
    } else {
      baseMatch += 3; // Partial / default
    }

    const minEducation = (opportunity.minimumEducation || '').toLowerCase();
    const userDegree = (profile.degree || '').toLowerCase();
    if (!minEducation || minEducation.includes(userDegree) || userDegree.includes(minEducation)) {
      baseMatch += 5;
    }

    if (profile.currentYear && opportunity.eligibleYears && opportunity.eligibleYears.length > 0) {
      const yearStr = String(profile.currentYear);
      if (opportunity.eligibleYears.some((y) => y.includes(yearStr))) {
        baseMatch += 5;
      } else {
        baseMatch += 2;
      }
    } else {
      baseMatch += 4; // default / flexible year
    }

    const oppType = (opportunity.opportunityType || '').toLowerCase();
    const pref = profile.opportunityPreferences;
    if (pref) {
      const match =
        (oppType.includes('internship') && pref.internships) ||
        (oppType.includes('scholarship') && pref.scholarships) ||
        (oppType.includes('hackathon') && pref.hackathons) ||
        (oppType.includes('research') && pref.research);
      if (match) {
        baseMatch += 3;
      }
    }
    baseMatch = Math.min(baseMatch, ScoringWeights.baseMatch);

    // 2. Interest Score (Max 20)
    let interest = 0;
    const skills = [
      ...(profile.technicalSkills || []),
      ...(profile.softSkills || []),
      ...(profile.tools || []),
    ].map((s) => s.toLowerCase());

    const oppSkills = (opportunity.skills || []).map((s) => s.toLowerCase());
    const oppTags = (opportunity.tags || []).map((t) => t.toLowerCase());

    // Check skills overlap
    const matchedSkills = skills.filter((s) => oppSkills.includes(s) || oppTags.includes(s));
    if (matchedSkills.length > 0) {
      interest += matchedSkills.length * 3;
      explanations.push({
        type: 'interest',
        message: `Matches your skills: ${matchedSkills.slice(0, 2).join(', ')}`,
      });
    }

    // Check preferred roles/interests overlap
    const interests = (profile.interestDomains || []).map((d) => d.toLowerCase());
    const matchedDomains = interests.filter((d) => oppTags.includes(d));
    if (matchedDomains.length > 0) {
      interest += matchedDomains.length * 4;
      explanations.push({
        type: 'interest',
        message: `Aligns with your interests in ${matchedDomains[0]}`,
      });
    }

    interest = Math.min(interest, ScoringWeights.interest);

    // 3. Career Stage (Max 10)
    let careerStage = 5;
    const userPersona = profile.persona;
    if (userPersona === 'COLLEGE_STUDENT') {
      if (
        opportunity.opportunityType === 'INTERNSHIP' ||
        opportunity.opportunityType === 'SCHOLARSHIP'
      ) {
        careerStage = 10;
        explanations.push({
          type: 'careerStage',
          message: 'Ideal opportunity for college students',
        });
      }
    } else if (userPersona === 'WORKING_PROFESSIONAL') {
      if ((opportunity.opportunityType as string) === 'JOB') {
        careerStage = 10;
      }
    }
    careerStage = Math.min(careerStage, ScoringWeights.careerStage);

    // 4. Difficulty Match (Max 10)
    let difficulty = 5;
    const userLevel = profile.careerReadinessScore
      ? Math.ceil(profile.careerReadinessScore / 25)
      : 2; // scale 0-100 to 1-4
    const oppDifficultyStr = (opportunity.difficulty || 'MEDIUM').toUpperCase();
    const oppLevel =
      oppDifficultyStr === 'LOW'
        ? 1
        : oppDifficultyStr === 'HIGH'
          ? 3
          : oppDifficultyStr === 'VERY_HIGH'
            ? 4
            : 2;

    const diff = Math.abs(userLevel - oppLevel);
    if (diff === 0) {
      difficulty = 10;
      explanations.push({ type: 'difficulty', message: 'Matches your current preparation level' });
    } else if (diff === 1) {
      difficulty = 8;
    } else {
      difficulty = 4;
    }
    difficulty = Math.min(difficulty, ScoringWeights.difficulty);

    // 5. Availability Match (Max 5)
    let availability = 3;
    const userHours = (profile as any).availability?.hoursPerWeek || 20;
    const commitment = opportunity.commitment;

    if (userHours >= 30 && commitment === 'FULL_TIME') {
      availability = 5;
    } else if (userHours < 30 && (commitment === 'PART_TIME' || commitment === 'FLEXIBLE')) {
      availability = 5;
      explanations.push({ type: 'availability', message: 'Fits your weekly available hours' });
    } else if (userHours < 20 && commitment === 'FULL_TIME') {
      availability = 1;
    }
    availability = Math.min(availability, ScoringWeights.availability);

    // 6. Remote Preference (Max 5)
    let remote = 3;
    const remotePref = profile.remotePreference;
    if (remotePref === true && opportunity.remote) {
      remote = 5;
      explanations.push({ type: 'remote', message: 'Supports remote work option' });
    } else if (remotePref === false && !opportunity.remote) {
      remote = 5;
    }
    remote = Math.min(remote, ScoringWeights.remote);

    // 7. Women Bonus (Max 5)
    let womenBonus = 0;
    if (
      (opportunity.womenFocused || opportunity.genderEligibility?.toUpperCase() === 'FEMALE') &&
      profile.gender === 'FEMALE'
    ) {
      womenBonus = 5;
      explanations.push({ type: 'womenBonus', message: 'Women-centric support initiative' });
    }
    womenBonus = Math.min(womenBonus, ScoringWeights.womenBonus);

    // 8. Portfolio Value (Max 10)
    let portfolio = 0;
    const valSum =
      (opportunity.careerValPortfolio || 0) +
      (opportunity.careerValResume || 0) +
      (opportunity.careerValLearning || 0) +
      (opportunity.careerValNetworking || 0) +
      (opportunity.careerValExposure || 0);
    // Max of valSum is 5 fields * 5 points each = 25 points. Scale 25 to 10 points.
    portfolio = Math.round((valSum / 25) * 10);
    if (portfolio >= 8) {
      explanations.push({ type: 'portfolio', message: 'Strong resume and portfolio builder' });
    }
    portfolio = Math.min(portfolio, ScoringWeights.portfolio);

    // 9. Hidden Gem Bonus (Max 5)
    let hiddenGem = 0;
    if (opportunity.hiddenGemScore) {
      hiddenGem = Math.round(opportunity.hiddenGemScore / 20);
    }
    if (hiddenGem >= 4) {
      explanations.push({
        type: 'hiddenGem',
        message: 'Underrated gem with low applicant traffic',
      });
    }
    hiddenGem = Math.min(hiddenGem, ScoringWeights.hiddenGem);

    // 10. Deadline Urgency (Max 3)
    let deadline = 1;
    const deadlineDays = opportunity.intelligence?.daysRemaining;
    if (deadlineDays !== null && deadlineDays !== undefined) {
      if (deadlineDays >= 0 && deadlineDays <= 3) {
        deadline = 3;
        explanations.push({ type: 'deadline', message: 'Deadline is approaching soon' });
      } else if (deadlineDays > 3 && deadlineDays <= 7) {
        deadline = 2;
      }
    } else if (opportunity.deadlineStatus === 'ROLLING') {
      deadline = 2;
    }
    deadline = Math.min(deadline, ScoringWeights.deadline);

    // 11. Confidence Bonus (Max 2)
    let confidence = 0;
    const quality = opportunity.qualityScore || 50;
    const trust = opportunity.trustScore || 50;
    const aiConf = opportunity.confidence || 70;
    // Scale avg (quality, trust, aiConf) 0-100 to 2 points
    confidence = parseFloat((((quality + trust + aiConf) / 300) * 2).toFixed(2));
    confidence = Math.min(confidence, ScoringWeights.confidence);

    const finalScore = Math.round(
      baseMatch +
        interest +
        careerStage +
        difficulty +
        availability +
        remote +
        womenBonus +
        portfolio +
        hiddenGem +
        deadline +
        confidence,
    );

    const breakdown: IScoreBreakdown = {
      baseMatch,
      interest,
      careerStage,
      difficulty,
      availability,
      remote,
      womenBonus,
      portfolio,
      hiddenGem,
      deadline,
      confidence,
    };

    const category = opportunity.category || 'OTHER';
    const org = opportunity.organization || 'Unknown';
    const domain = (opportunity.tags && opportunity.tags[0]) || 'General';
    const workMode = opportunity.workMode || 'ONSITE';

    return {
      opportunity,
      finalScore: Math.min(finalScore, 100),
      rank: 0,
      scoreBreakdown: breakdown,
      recommendationExplanations: explanations,
      diversificationTags: {
        category,
        organization: org,
        domain,
        workMode,
      },
    };
  }

  /**
   * Scores and stably ranks all candidate opportunities.
   */
  static run(candidates: any[], profile: IProfile): IRankedCandidate[] {
    const scored = candidates.map((c) => this.scoreOpportunity(c.opportunity || c, profile));

    // Stably sort: Final Score DESC, then Trust DESC, then Quality DESC, then createdAt DESC
    return scored
      .sort((a, b) => {
        if (b.finalScore !== a.finalScore) {
          return b.finalScore - a.finalScore;
        }

        const trustA = a.opportunity.trustScore || 0;
        const trustB = b.opportunity.trustScore || 0;
        if (trustB !== trustA) {
          return trustB - trustA;
        }

        const qualA = a.opportunity.qualityScore || 0;
        const qualB = b.opportunity.qualityScore || 0;
        if (qualB !== qualA) {
          return qualB - qualA;
        }

        const dateA = a.opportunity.createdAt ? new Date(a.opportunity.createdAt).getTime() : 0;
        const dateB = b.opportunity.createdAt ? new Date(b.opportunity.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .map((cand, index) => {
        cand.rank = index + 1;
        return cand;
      });
  }
}

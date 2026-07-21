import { CandidateSnapshot } from './candidate-snapshot';

export type RecommendationStrength = 'excellent' | 'strong' | 'good' | 'weak';

export interface ScoreBreakdown {
  skillMatch: number;
  projectMatch: number;
  careerGoal: number;
  opportunityType: number;
  careerStage: number;
  location: number;
  womenPreference: number;
  freshness: number;
  deadline: number;
  hiddenGem: number;
  softPenalties: number;
}

export interface RankedOpportunity {
  opportunity: any;
  totalScore: number;
  scoreBreakdown: ScoreBreakdown;
  matchedSkills: string[];
  matchedProjects: string[];
  matchedGoals: string[];
  reasons: string[];
  recommendationStrength: RecommendationStrength;
}

export class RecommendationScorer {
  /**
   * Deterministically scores a candidate against an eligible opportunity.
   * Returns null if total score is below the minimum quality threshold of 45.
   */
  public score(snapshot: CandidateSnapshot, opportunity: any): RankedOpportunity | null {
    const matchedSkills: string[] = [];
    const matchedProjects: string[] = [];
    const matchedGoals: string[] = [];
    const reasons: string[] = [];

    const oppTitle = (opportunity.title || '').toLowerCase();
    const oppDesc = (opportunity.description || opportunity.summary || '').toLowerCase();
    const oppFullText = `${oppTitle} ${oppDesc}`;
    const oppSkills = (opportunity.skills || []).map((s: string) => s.toLowerCase());
    const oppTags = (opportunity.tags || []).map((t: string) => t.toLowerCase());

    // 1. Skill Match (Weight: 25)
    let skillMatchScore = 0;
    const candidateTechs = snapshot.strongestTechnologies.concat(snapshot.technologies);

    for (const tech of candidateTechs) {
      const isTechInOpp =
        oppSkills.some((s: string) => s.includes(tech) || tech.includes(s)) ||
        oppTags.some((t: string) => t.includes(tech)) ||
        oppFullText.includes(tech);

      if (isTechInOpp) {
        if (!matchedSkills.includes(tech)) {
          matchedSkills.push(tech);
        }
      }
    }

    if (matchedSkills.length > 0) {
      skillMatchScore = Math.min(
        25,
        Math.round((matchedSkills.length / Math.max(1, candidateTechs.length)) * 25) +
          matchedSkills.length * 3,
      );
      skillMatchScore = Math.min(25, skillMatchScore);
      reasons.push(`Matches skills: ${matchedSkills.slice(0, 3).join(', ')}`);
    }

    // 2. Project Match & Theme Category Boosts (Weight: 25)
    let projectMatchScore = 0;
    let hasCategoryBoost = false;

    for (const project of snapshot.projects) {
      const projTitle = project.title || '';
      const projCat = project.category || '';
      let projMatched = false;

      // Tech overlap in project
      for (const pTech of project.technologies) {
        if (oppFullText.includes(pTech.toLowerCase())) {
          projMatched = true;
          break;
        }
      }

      // Explicit Category Theme Boost (+15 max)
      if (
        projCat === 'AI Platform' &&
        /\b(ai|llm|gpt|gemini|ml|machine learning|nlp)\b/i.test(oppFullText)
      ) {
        projectMatchScore += 15;
        projMatched = true;
        hasCategoryBoost = true;
      } else if (
        projCat === 'Backend System' &&
        /\b(backend|express|node|mongo|api|database|server|sql)\b/i.test(oppFullText)
      ) {
        projectMatchScore += 15;
        projMatched = true;
        hasCategoryBoost = true;
      } else if (
        projCat === 'Full Stack Web App' &&
        /\b(fullstack|full-stack|web|react|frontend|nextjs|node)\b/i.test(oppFullText)
      ) {
        projectMatchScore += 15;
        projMatched = true;
        hasCategoryBoost = true;
      } else if (
        projCat === 'Browser Extension' &&
        /\b(chrome|browser|extension|frontend|react)\b/i.test(oppFullText)
      ) {
        projectMatchScore += 12;
        projMatched = true;
        hasCategoryBoost = true;
      } else if (
        projCat === 'Cloud Infrastructure' &&
        /\b(cloud|devops|docker|kubernetes|aws|gcp)\b/i.test(oppFullText)
      ) {
        projectMatchScore += 15;
        projMatched = true;
        hasCategoryBoost = true;
      }

      if (projMatched) {
        projectMatchScore += 5;
        if (!matchedProjects.includes(projTitle)) {
          matchedProjects.push(projTitle);
        }
      }
    }

    projectMatchScore = Math.min(25, projectMatchScore);
    if (matchedProjects.length > 0) {
      reasons.push(`Relevant project experience: ${matchedProjects.join(', ')}`);
    }

    // 3. Career Goal Match (Weight: 10)
    let careerGoalScore = 0;
    for (const goal of snapshot.goals) {
      const goalLower = goal.toLowerCase();
      if (
        (goalLower.includes('intern') &&
          (oppTitle.includes('intern') || opportunity.opportunityType === 'INTERNSHIP')) ||
        (goalLower.includes('first') && /\b(early|junior|entry|intern)\b/i.test(oppFullText))
      ) {
        careerGoalScore = 10;
        if (!matchedGoals.includes(goal)) matchedGoals.push(goal);
      }
    }
    if (careerGoalScore === 0 && snapshot.goals.length > 0) {
      careerGoalScore = 5;
      matchedGoals.push(snapshot.goals[0]);
    }
    if (careerGoalScore > 0) {
      reasons.push('Aligns with career goals');
    }

    // 4. Opportunity Type Match (Weight: 10)
    let opportunityTypeScore = 0;
    const oppTypeDisplay = opportunity.opportunityType || 'INTERNSHIP';
    if (
      snapshot.opportunityTypes.some(
        (t) =>
          t.toLowerCase() === oppTypeDisplay.toLowerCase() ||
          (t === 'Internship' && oppTypeDisplay === 'INTERNSHIP'),
      )
    ) {
      opportunityTypeScore = 10;
    } else {
      opportunityTypeScore = 5;
    }

    // 5. Career Stage Match (Weight: 10)
    let careerStageScore = 0;
    if (snapshot.persona === 'College Student') {
      if (
        oppTitle.includes('intern') ||
        oppTitle.includes('trainee') ||
        opportunity.experienceRequired === 'NONE'
      ) {
        careerStageScore = 10;
        reasons.push('Great entry-level student fit');
      } else {
        careerStageScore = 5;
      }
    } else {
      careerStageScore = 8;
    }

    // 6. Location Match (Weight: 5)
    let locationScore = 0;
    if (opportunity.remote || snapshot.preferences.remote) {
      locationScore = 5;
    } else if (snapshot.education?.branch || snapshot.preferences?.startup) {
      locationScore = 3;
    }

    // 7. Women Preference Match (Weight: 5)
    let womenPrefScore = 0;
    const isWomenFocused =
      opportunity.genderEligibility === 'FEMALE' ||
      /\b(women|female|diversity|she|girls)\b/i.test(oppFullText);

    if (snapshot.preferences.womenOnly) {
      if (isWomenFocused) {
        womenPrefScore = 5;
        reasons.push('Women-focused initiative match');
      } else {
        womenPrefScore = 2;
      }
    } else {
      womenPrefScore = isWomenFocused ? 5 : 3;
    }

    // 8. Freshness (Weight: 5)
    let freshnessScore = 3;
    if (opportunity.discoveredAt || opportunity.createdAt) {
      const created = new Date(opportunity.discoveredAt || opportunity.createdAt);
      const daysOld = (Date.now() - created.getTime()) / (1000 * 3600 * 24);
      if (daysOld <= 7) freshnessScore = 5;
      else if (daysOld <= 14) freshnessScore = 4;
      else if (daysOld <= 30) freshnessScore = 3;
      else freshnessScore = 2;
    }

    // 9. Deadline (Weight: 3)
    let deadlineScore = 2;
    if (opportunity.deadline) {
      const dl = new Date(opportunity.deadline);
      const daysLeft = (dl.getTime() - Date.now()) / (1000 * 3600 * 24);
      if (daysLeft > 0 && daysLeft <= 14) deadlineScore = 3;
      else if (daysLeft > 14) deadlineScore = 2;
    } else {
      deadlineScore = 2; // rolling application
    }

    // 10. Hidden Gem Bonus (Weight: 2)
    let hiddenGemScore = 0;
    if (
      opportunity.hiddenGemScore >= 70 ||
      opportunity.organizationType === 'STARTUP' ||
      (opportunity.qualityScore && opportunity.qualityScore >= 80)
    ) {
      hiddenGemScore = 2;
    }

    // Soft Penalties Calculation
    let softPenalties = 0;
    if (!opportunity.remote && !snapshot.preferences.remote) {
      softPenalties += 2;
    }
    if (!opportunity.stipend && !opportunity.salary && opportunity.fundingType === 'UNPAID') {
      softPenalties += 3;
    }
    if (!opportunity.deadline) {
      softPenalties += 1;
    }
    if (snapshot.preferences.womenOnly && !isWomenFocused) {
      softPenalties += 4;
    }

    const rawTotal =
      skillMatchScore +
      projectMatchScore +
      careerGoalScore +
      opportunityTypeScore +
      careerStageScore +
      locationScore +
      womenPrefScore +
      freshnessScore +
      deadlineScore +
      hiddenGemScore -
      softPenalties;

    const totalScore = Math.max(0, Math.min(100, Math.round(rawTotal)));

    // Minimum Threshold: Discard if totalScore < 45
    if (totalScore < 45) {
      return null;
    }

    // Assign Recommendation Strength
    let recommendationStrength: RecommendationStrength = 'weak';
    if (totalScore >= 90) recommendationStrength = 'excellent';
    else if (totalScore >= 75) recommendationStrength = 'strong';
    else if (totalScore >= 60) recommendationStrength = 'good';
    else recommendationStrength = 'weak';

    const scoreBreakdown: ScoreBreakdown = {
      skillMatch: skillMatchScore,
      projectMatch: projectMatchScore,
      careerGoal: careerGoalScore,
      opportunityType: opportunityTypeScore,
      careerStage: careerStageScore,
      location: locationScore,
      womenPreference: womenPrefScore,
      freshness: freshnessScore,
      deadline: deadlineScore,
      hiddenGem: hiddenGemScore,
      softPenalties,
    };

    return {
      opportunity,
      totalScore,
      scoreBreakdown,
      matchedSkills,
      matchedProjects,
      matchedGoals,
      reasons,
      recommendationStrength,
    };
  }
}

import { IRecommendationContext } from '../context/context.types';

export function buildStretchGoalPrompt(context: IRecommendationContext): string {
  return `Stretch Goal Slot Instructions:
- Objective: Explain an ambitious opportunity slightly above the candidate's current profile.
- Tone/Style: Encouraging, realistic, coaching. Emphasize a growth mindset. Never sound discouraging or use negative words.
- Key Focus: Highlight strengths already present, explain the gap constructively, and outline why extending themselves to apply is highly worthwhile.
- Slot Context:
  * Title: ${context.opportunity.title}
  * Company: ${context.opportunity.organization}
  * Type: ${context.opportunity.opportunityType}
  * Location: ${context.opportunity.location} (Work Mode: ${context.opportunity.workMode})
  * Overall Match Score: ${context.matchAnalysis.overallMatch}%
  * Matching Technical Skills: ${context.matchAnalysis.topMatchingSkills.join(', ') || 'None'}
  * Missing Skills/Gaps: ${context.matchAnalysis.missingSkills.join(', ') || 'None'}
  * Match Insights: ${context.humanReadableSummary}
  * Learning Potential: ${context.insights.learningPotential}
  * Technical Strengths: ${context.resumeStrength.bulletPoints.join(', ')}`;
}

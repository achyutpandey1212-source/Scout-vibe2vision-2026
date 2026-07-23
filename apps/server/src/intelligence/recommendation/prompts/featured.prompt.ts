import { IRecommendationContext } from '../context/context.types';

export function buildFeaturedPrompt(context: IRecommendationContext): string {
  return `Featured Recommendation (Perfect Match) Slot Instructions:
- Objective: Explain today's absolute strongest recommendation with high confidence.
- Tone/Style: Authoritative, decisive, precise, evidence-based, zero exaggeration. Do not use generic filler or hedging language.
- Key Focus: High alignment with strongest technologies, trajectory, and why the timing is right.
- Slot Context:
  * Title: ${context.opportunity.title}
  * Company: ${context.opportunity.organization}
  * Type: ${context.opportunity.opportunityType}
  * Location: ${context.opportunity.location} (Work Mode: ${context.opportunity.workMode})
  * Overall Match Score: ${context.matchAnalysis.overallMatch}%
  * Matching Technical Skills: ${context.matchAnalysis.topMatchingSkills.join(', ') || 'None'}
  * Missing Skills/Gaps: ${context.matchAnalysis.missingSkills.join(', ') || 'None'}
  * Match Insights: ${context.humanReadableSummary}
  * Relevance: Aligns with preferred roles [${context.careerGoals.preferredRoles.join(', ')}] and interests [${context.careerGoals.interestedDomains.join(', ')}].
  * Resume Project Alignment: ${context.matchAnalysis.relevantResumeProjects.join(', ') || 'General profile match'}
  * Relevant Experience: ${context.matchAnalysis.relevantExperience.join(', ') || 'None'}`;
}

import { IRecommendationContext } from '../context/context.types';

export function buildHiddenGemPrompt(context: IRecommendationContext): string {
  return `Hidden Gem Slot Instructions:
- Objective: Explain a high-value opportunity the candidate might not discover naturally.
- Tone/Style: Exploratory, insightful, conversational, curiosity-driven. Highlight hidden value.
- Key Focus: Highlight unusual learning potential, unique company benefits, startup agility, or unexpected fit with candidate's side projects.
- Slot Context:
  * Title: ${context.opportunity.title}
  * Company: ${context.opportunity.organization}
  * Type: ${context.opportunity.opportunityType}
  * Location: ${context.opportunity.location} (Work Mode: ${context.opportunity.workMode})
  * Overall Match Score: ${context.matchAnalysis.overallMatch}%
  * Matching Technical Skills: ${context.matchAnalysis.topMatchingSkills.join(', ') || 'None'}
  * Missing Skills/Gaps: ${context.matchAnalysis.missingSkills.join(', ') || 'None'}
  * Match Insights: ${context.humanReadableSummary}
  * Key Project Match: ${context.matchAnalysis.relevantResumeProjects[0] || 'Personal projects'}
  * Motivation Alignment: startup or growth opportunity aligning with goals.`;
}

import { IRecommendationContext } from '../context/context.types';

export function buildConfidenceBuilderPrompt(context: IRecommendationContext): string {
  return `Confidence Builder Slot Instructions:
- Objective: Explain an opportunity designed to build career momentum and expand candidate's portfolio.
- Tone/Style: Supportive, optimistic, career-oriented. Avoid sounding inferior or using terms like "easy".
- Key Focus: Portfolio building, experience accumulation, adding resume value, and preparing for future interviews.
- Slot Context:
  * Title: ${context.opportunity.title}
  * Company: ${context.opportunity.organization}
  * Type: ${context.opportunity.opportunityType}
  * Location: ${context.opportunity.location} (Work Mode: ${context.opportunity.workMode})
  * Overall Match Score: ${context.matchAnalysis.overallMatch}%
  * Matching Technical Skills: ${context.matchAnalysis.topMatchingSkills.join(', ') || 'None'}
  * Missing Skills/Gaps: ${context.matchAnalysis.missingSkills.join(', ') || 'None'}
  * Match Insights: ${context.humanReadableSummary}
  * Key Growth Focus: Accumulating real-world project experience and resume enhancement.`;
}

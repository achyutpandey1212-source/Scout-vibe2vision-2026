import { IRecommendationContext } from '../context/context.types';

export function buildQuickWinPrompt(context: IRecommendationContext): string {
  return `Quick Win Slot Instructions:
- Objective: Explain an opportunity with exceptionally high application confidence. Reduces decision fatigue.
- Tone/Style: Calm, reassuring, practical, low-friction. Avoid overselling or guaranteeing placement.
- Key Focus: Direct compatibility, fast apply, high chance of resume shortlisting, and minimal barriers to entry.
- Slot Context:
  * Title: ${context.opportunity.title}
  * Company: ${context.opportunity.organization}
  * Type: ${context.opportunity.opportunityType}
  * Location: ${context.opportunity.location} (Work Mode: ${context.opportunity.workMode})
  * Overall Match Score: ${context.matchAnalysis.overallMatch}%
  * Matching Technical Skills: ${context.matchAnalysis.topMatchingSkills.join(', ') || 'None'}
  * Missing Skills/Gaps: ${context.matchAnalysis.missingSkills.join(', ') || 'None'}
  * Match Insights: ${context.humanReadableSummary}
  * Application Urgency: ${context.insights.applicationUrgency}
  * Resume Fit Level: ${context.insights.resumeFit}`;
}

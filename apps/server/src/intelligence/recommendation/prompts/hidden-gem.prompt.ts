import { IRecommendationContext } from '../context/context.types';

export function buildHiddenGemPrompt(context: IRecommendationContext): string {
  return `Hidden Gem Slot Instructions:
- Objective: Explain a high-value opportunity the candidate might not discover naturally.
- Tone/Style: Exploratory, insightful, conversational, curiosity-driven. Highlight hidden value.
- Key Focus: Highlight unusual learning potential, unique company benefits, startup agility, or unexpected fit with candidate's side projects.
- Verdict Style: "It may not attract the most attention, but it could deliver some of the strongest long-term learning."
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

Please construct a comprehensive Career Report return format:
- executiveSummary: 2-3 concise editorial sentences explaining why this matters.
- whyScoutPickedThis: Highly detailed evidence-driven explanation citing profile/role alignment.
- strengths: 3-5 concise bullets detailing candidate technical strengths matching this role.
- challenges: list of genuine gaps with reassurance (e.g. "While Kubernetes experience is preferred, your backend foundation makes this a reasonable gap to bridge").
- applicationStrategy: Practical mentoring on how to apply (emphasize relevant projects, tailor resume sections, highlight Git repositories).
- preparationChecklist: Checklist of actionable prep items (max 6 items).
- scoutVerdict: Persona-specific verdict: "It may not attract the most attention, but it could deliver some of the strongest long-term learning."`;
}

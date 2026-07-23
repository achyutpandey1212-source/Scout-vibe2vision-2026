import { IRecommendationContext } from '../context/context.types';

export function buildConfidenceBuilderPrompt(context: IRecommendationContext): string {
  return `Confidence Builder Slot Instructions:
- Objective: Explain an opportunity designed to build career momentum and expand candidate's portfolio.
- Tone/Style: Supportive, optimistic, career-oriented. Avoid sounding inferior or using terms like "easy".
- Key Focus: Portfolio building, experience accumulation, adding resume value, and preparing for future interviews.
- Verdict Style: "Every strong career begins with opportunities like this. The experience gained here can unlock much bigger ones later."
- Slot Context:
  * Title: ${context.opportunity.title}
  * Company: ${context.opportunity.organization}
  * Type: ${context.opportunity.opportunityType}
  * Location: ${context.opportunity.location} (Work Mode: ${context.opportunity.workMode})
  * Overall Match Score: ${context.matchAnalysis.overallMatch}%
  * Matching Technical Skills: ${context.matchAnalysis.topMatchingSkills.join(', ') || 'None'}
  * Missing Skills/Gaps: ${context.matchAnalysis.missingSkills.join(', ') || 'None'}
  * Match Insights: ${context.humanReadableSummary}
  * Key Growth Focus: Accumulating real-world project experience and resume enhancement.

Please construct a comprehensive Career Report return format:
- executiveSummary: 2-3 concise editorial sentences explaining why this matters.
- whyScoutPickedThis: Highly detailed evidence-driven explanation citing profile/role alignment.
- strengths: 3-5 concise bullets detailing candidate technical strengths matching this role.
- challenges: list of genuine gaps with reassurance (e.g. "While Kubernetes experience is preferred, your backend foundation makes this a reasonable gap to bridge").
- applicationStrategy: Practical mentoring on how to apply (emphasize relevant projects, tailor resume sections, highlight Git repositories).
- preparationChecklist: Checklist of actionable prep items (max 6 items).
- scoutVerdict: Persona-specific verdict: "Every strong career begins with opportunities like this. The experience gained here can unlock much bigger ones later."`;
}

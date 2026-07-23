import { IRecommendationContext } from '../context/context.types';

export function buildQuickWinPrompt(context: IRecommendationContext): string {
  return `Quick Win Slot Instructions:
- Objective: Explain an opportunity with exceptionally high application confidence. Reduces decision fatigue.
- Tone/Style: Calm, reassuring, practical, low-friction. Avoid overselling or guaranteeing placement.
- Key Focus: Direct compatibility, fast apply, high chance of resume shortlisting, and minimal barriers to entry.
- Verdict Style: "This is a practical opportunity where your existing strengths already match the expectations well."
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
  * Resume Fit Level: ${context.insights.resumeFit}

Please construct a comprehensive Career Report return format:
- executiveSummary: 2-3 concise editorial sentences explaining why this matters.
- whyScoutPickedThis: Highly detailed evidence-driven explanation citing profile/role alignment.
- strengths: 3-5 concise bullets detailing candidate technical strengths matching this role.
- challenges: list of genuine gaps with reassurance (e.g. "While Kubernetes experience is preferred, your backend foundation makes this a reasonable gap to bridge").
- applicationStrategy: Practical mentoring on how to apply (emphasize relevant projects, tailor resume sections, highlight Git repositories).
- preparationChecklist: Checklist of actionable prep items (max 6 items).
- scoutVerdict: Persona-specific verdict: "This is a practical opportunity where your existing strengths already match the expectations well."`;
}

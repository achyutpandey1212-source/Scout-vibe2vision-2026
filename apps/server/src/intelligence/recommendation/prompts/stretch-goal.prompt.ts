import { IRecommendationContext } from '../context/context.types';

export function buildStretchGoalPrompt(context: IRecommendationContext): string {
  return `Stretch Goal Slot Instructions:
- Objective: Explain an ambitious opportunity slightly above the candidate's current profile.
- Tone/Style: Encouraging, realistic, coaching. Emphasize a growth mindset. Never sound discouraging or use negative words.
- Key Focus: Highlight strengths already present, explain the gap constructively, and outline why extending themselves to apply is highly worthwhile.
- Verdict Style: "You're reaching slightly beyond your current experience—but that's exactly why it's worth considering."
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
  * Technical Strengths: ${context.resumeStrength.bulletPoints.join(', ')}

Please construct a comprehensive Career Report return format:
- executiveSummary: 2-3 concise editorial sentences explaining why this matters.
- whyScoutPickedThis: Highly detailed evidence-driven explanation citing profile/role alignment.
- strengths: 3-5 concise bullets detailing candidate technical strengths matching this role.
- challenges: list of genuine gaps with reassurance (e.g. "While Kubernetes experience is preferred, your backend foundation makes this a reasonable gap to bridge").
- applicationStrategy: Practical mentoring on how to apply (emphasize relevant projects, tailor resume sections, highlight Git repositories).
- preparationChecklist: Checklist of actionable prep items (max 6 items).
- scoutVerdict: Persona-specific verdict: "You're reaching slightly beyond your current experience—but that's exactly why it's worth considering."`;
}

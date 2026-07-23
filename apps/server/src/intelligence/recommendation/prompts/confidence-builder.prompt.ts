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
- strongestStrengths: 3-5 concise bullets detailing candidate technical strengths matching this role.
- strengths: 3-5 concise bullets (can duplicate strongestStrengths).
- challenges: list of genuine gaps with reassurance (e.g. "While Kubernetes experience is preferred, your backend foundation makes this a reasonable gap to bridge").
- resumeImprovements: 3-5 specific, actionable suggestions for how to tailor the resume for this role.
- interviewPrep: 3-5 likely interview topics. Reference the specific role and the candidate's background.
- applicationConfidence: { level: "Very Competitive" or "Competitive" or "Moderate Match" or "Stretch Opportunity" or "High Risk", explanation: "Encouraging mentor confidence note explaining why" }
- nextAction: One specific 30-60 minute action step before applying.
- scoutVerdict: { verdict: "Apply Immediately" or "Apply After Small Improvements" or "Stretch Opportunity" or "Probably Skip" or "Monitor Later", explanation: "Every strong career begins with opportunities like this. The experience gained here can unlock much bigger ones later." }
- applicationStrategy: Practical mentoring on how to apply (emphasize relevant projects, tailor resume sections, highlight Git repositories).
- preparationChecklist: Checklist of actionable prep items (max 6 items).
- personalizedReason: Compact (<=250 chars) summary combining Why You + First Step.
- firstAction: One 30-minute actionable step (<=150 chars).
- confidenceMessage: Encouraging note (<=150 chars).
- whyNow: Why timing matters (<=150 chars).
- projectEvidence: Which project proves which skill for this role (<=300 chars).
- whyYou: Why this candidate specifically fits (<=250 chars).
- whyCompany: Why this opportunity benefits their career (<=250 chars).`;
}

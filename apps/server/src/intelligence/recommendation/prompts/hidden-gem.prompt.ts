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
- strongestStrengths: 3-5 concise bullets detailing candidate technical strengths matching this role.
- strengths: 3-5 concise bullets (can duplicate strongestStrengths).
- challenges: list of genuine gaps with reassurance (e.g. "While Kubernetes experience is preferred, your backend foundation makes this a reasonable gap to bridge").
- resumeImprovements: 3-5 specific, actionable suggestions for how to tailor the resume for this role.
- interviewPrep: 3-5 likely interview topics. Reference the specific role and the candidate's background.
- applicationConfidence: { level: "Very Competitive" or "Competitive" or "Moderate Match" or "Stretch Opportunity" or "High Risk", explanation: "Encouraging mentor confidence note explaining why" }
- nextAction: One specific 30-60 minute action step before applying.
- scoutVerdict: { verdict: "Apply Immediately" or "Apply After Small Improvements" or "Stretch Opportunity" or "Probably Skip" or "Monitor Later", explanation: "It may not attract the most attention, but it could deliver some of the strongest long-term learning." }
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

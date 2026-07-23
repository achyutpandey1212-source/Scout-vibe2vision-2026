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
- strongestStrengths: 3-5 concise bullets detailing candidate technical strengths matching this role.
- strengths: 3-5 concise bullets (can duplicate strongestStrengths).
- challenges: list of genuine gaps with reassurance (e.g. "While Kubernetes experience is preferred, your backend foundation makes this a reasonable gap to bridge").
- resumeImprovements: 3-5 specific, actionable suggestions for how to tailor the resume for this role.
- interviewPrep: 3-5 likely interview topics. Reference the specific role and the candidate's background.
- applicationConfidence: { level: "Very Competitive" or "Competitive" or "Moderate Match" or "Stretch Opportunity" or "High Risk", explanation: "Encouraging mentor confidence note explaining why" }
- nextAction: One specific 30-60 minute action step before applying.
- scoutVerdict: { verdict: "Apply Immediately" or "Apply After Small Improvements" or "Stretch Opportunity" or "Probably Skip" or "Monitor Later", explanation: "You're reaching slightly beyond your current experience—but that's exactly why it's worth considering." }
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

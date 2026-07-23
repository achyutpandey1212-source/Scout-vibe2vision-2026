import { IRecommendationContext } from '../context/context.types';

export function buildFeaturedPrompt(context: IRecommendationContext): string {
  return `Featured Recommendation (Perfect Match) Slot Instructions:
- Objective: Explain today's absolute strongest recommendation with high confidence.
- Tone/Style: Authoritative, decisive, precise, evidence-based, zero exaggeration. Do not use generic filler or hedging language.
- Key Focus: Strongest alignment with candidate's core projects/technologies. Explain why the timing is right.
- Verdict Style: "This is one of today's strongest opportunities for your current profile and deserves priority attention."
- Slot Context:
  * Title: ${context.opportunity.title}
  * Company: ${context.opportunity.organization}
  * Type: ${context.opportunity.opportunityType}
  * Location: ${context.opportunity.location} (Work Mode: ${context.opportunity.workMode})
  * Overall Match Score: ${context.matchAnalysis.overallMatch}%
  * Matching Technical Skills: ${context.matchAnalysis.topMatchingSkills.join(', ') || 'None'}
  * Missing Skills/Gaps: ${context.matchAnalysis.missingSkills.join(', ') || 'None'}
  * Match Insights: ${context.humanReadableSummary}
  * Relevance: Aligns with preferred roles [${context.careerGoals.preferredRoles.join(', ')}] and interests [${context.careerGoals.interestedDomains.join(', ')}].
  * Resume Project Alignment: ${context.matchAnalysis.relevantResumeProjects.join(', ') || 'General profile match'}
  * Relevant Experience: ${context.matchAnalysis.relevantExperience.join(', ') || 'None'}

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
- scoutVerdict: { verdict: "Apply Immediately" or "Apply After Small Improvements" or "Stretch Opportunity" or "Probably Skip" or "Monitor Later", explanation: "This is one of today's strongest opportunities for your current profile and deserves priority attention." }
- applicationStrategy: Practical mentoring on how to apply (emphasize relevant projects, tailor resume sections, highlight Git repositories).
- preparationChecklist: Checklist of actionable prep items (max 6 items, e.g. "Review Node.js fundamentals", "Refresh SQL joins").
- personalizedReason: Compact (<=250 chars) summary combining Why You + First Step.
- firstAction: One 30-minute actionable step (<=150 chars).
- confidenceMessage: Encouraging note (<=150 chars).
- whyNow: Why timing matters (<=150 chars).
- projectEvidence: Which project proves which skill for this role (<=300 chars).
- whyYou: Why this candidate specifically fits (<=250 chars).
- whyCompany: Why this opportunity benefits their career (<=250 chars).`;
}

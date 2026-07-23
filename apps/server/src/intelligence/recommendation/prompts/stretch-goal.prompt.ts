import { IRecommendationContext, ISlotOpportunityContext } from '../context/context.types';

export function buildStretchGoalPrompt(
  context: IRecommendationContext,
  slotCtx?: ISlotOpportunityContext,
): string {
  const opp =
    slotCtx?.opportunityBrief ||
    context.opportunityContexts?.[4]?.opportunityBrief ||
    context.opportunity;
  const match =
    slotCtx?.matchIntelligence ||
    context.opportunityContexts?.[4]?.matchIntelligence ||
    context.matchAnalysis;

  return `Stretch Goal Slot Instructions:
- Objective: Explain an ambitious opportunity slightly above the candidate's current profile.
- Persona Verdict Focus: "You're reaching slightly beyond your current experience—but that's exactly why it's worth considering."
- Target Role: ${opp?.role || opp?.title} at ${opp?.company || opp?.organization}
- Key Match Reason: ${match?.reasonCandidateRankedHighly || 'High learning potential and ambitious career growth.'}
- Required Skills: ${(opp?.requiredSkills || []).join(', ')}
- Top Matching Skills: ${(match?.topMatchingSkills || []).join(', ')}
- Skill Gaps: ${(match?.missingSkills || []).join(', ') || 'None'}
- Relevant Projects: ${(match?.relevantProjects || []).join(', ') || 'General profile match'}

Construct a detailed Career Report with:
- executiveSummary: 2-3 concise editorial sentences explaining why this matters.
- whyScoutPickedThis: Highly detailed evidence-driven explanation citing profile/role alignment.
- strongestStrengths: 3-5 concise bullets detailing candidate technical strengths matching this role.
- strengths: 3-5 concise bullets.
- challenges: list of genuine gaps with reassurance.
- resumeImprovements: 3-5 specific, actionable suggestions for how to tailor the resume for this role.
- interviewPrep: 3-5 likely interview topics referencing candidate's projects.
- applicationConfidence: { level: "Stretch Opportunity" or "High Risk", explanation: "Ambitious target requiring focused prep" }
- nextAction: One specific 30-60 minute action step before applying.
- scoutVerdict: { verdict: "Stretch Opportunity", explanation: "You're reaching slightly beyond your current experience—but that's exactly why it's worth considering." }
- applicationStrategy: Practical mentoring on how to apply.
- preparationChecklist: Checklist of actionable prep items (max 6 items).
- personalizedReason: Compact (<=250 chars) summary.
- firstAction: One 30-minute actionable step (<=150 chars).
- confidenceMessage: Encouraging note (<=150 chars).
- whyNow: Why timing matters (<=150 chars).
- projectEvidence: Which project proves which skill for this role (<=300 chars).
- whyYou: Why this candidate specifically fits (<=250 chars).
- whyCompany: Why this opportunity benefits their career (<=250 chars).`;
}

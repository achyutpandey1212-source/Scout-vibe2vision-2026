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

  return `Stretch Goal Slot Identity & Report Narrative Rules:
- Slot Identity: Ambitious target slightly above current profile. High growth upside requiring focused preparation.
- Target Role: ${opp?.role || opp?.title} at ${opp?.company || opp?.organization}
- Key Match Reason: ${match?.reasonCandidateRankedHighly || 'High learning potential and ambitious career growth.'}
- Required Skills: ${(opp?.requiredSkills || []).join(', ')}
- Top Matching Skills: ${(match?.topMatchingSkills || []).join(', ')}
- Skill Gaps: ${(match?.missingSkills || []).join(', ') || 'None'}
- Relevant Projects: ${(match?.relevantProjects || []).join(', ') || 'General profile match'}

Section Hierarchy & Non-Repetition Rules:
- executiveSummary: Explain ONLY why pursuing this ambitious stretch opportunity is worth the extra preparation effort.
- whyScoutPickedThis: Detail the technical delta between candidate's current project foundation and role expectations, framing it constructively.
- strongestStrengths: 3-5 bullets linking candidate's demonstrated project proof to role requirements.
- missingSkills: Up to 3 key technical gaps that must be bridged for interview readiness.
- resumeImprovements: 3-5 specific resume/README enhancements to maximize candidate competitiveness.
- interviewPrep: 3-5 likely technical interview discussion topics targeting advanced role requirements based on candidate's project architecture.
- applicationConfidence: { level: "Stretch Opportunity", explanation: "High learning curve requiring targeted project README enhancement." }
- nextAction: Exactly one 30-60 minute executable step for the next 24-48 hours.
- scoutVerdict: { verdict: "Stretch Opportunity", explanation: "Reaching slightly beyond your current experience—worth pursuing because the growth upside is significant." }
- applicationStrategy: Practical strategy on how to frame current project experience as a bridge to higher role expectations.
- preparationChecklist: 4-6 concrete, actionable preparation steps focused on gap reduction.
- personalizedReason: Compact summary (max 250 chars).
- firstAction: One 30-minute actionable step (max 150 chars).
- confidenceMessage: Reassuring mentor note (max 150 chars).
- whyNow: Timing & deadline momentum (max 150 chars).
- projectEvidence: Explicit mapping of candidate project to role requirements (max 300 chars).
- whyYou: Candidate match reasoning (max 250 chars).
- whyCompany: Value proposition of this company for candidate's growth (max 250 chars).
- strengths: 3-5 concise bullets mirroring strongestStrengths.
- challenges: 2-3 gaps with reassuring mentor framing.`;
}

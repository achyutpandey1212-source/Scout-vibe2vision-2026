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

  return `Slot Identity: Stretch Goal — Ambitious target slightly above current profile with high growth upside.
- Focus: Encourage candidate to reach beyond current comfort zone while providing a clear blueprint to bridge technical gaps.
- Target Role: ${opp?.role || opp?.title} at ${opp?.company || opp?.organization}
- Key Match Evidence: ${match?.reasonCandidateRankedHighly || 'High learning potential and ambitious career growth.'}
- Top Relevant Project: ${(match?.relevantProjects || [])[0] || 'Core technical foundation'}
- Scout Verdict Guidance: { verdict: "Stretch Opportunity", explanation: "Reaching slightly beyond current experience—worth pursuing because the growth upside is significant." }`;
}

import { IRecommendationContext, ISlotOpportunityContext } from '../context/context.types';

export function buildQuickWinPrompt(
  context: IRecommendationContext,
  slotCtx?: ISlotOpportunityContext,
): string {
  const opp =
    slotCtx?.opportunityBrief ||
    context.opportunityContexts?.[2]?.opportunityBrief ||
    context.opportunity;
  const match =
    slotCtx?.matchIntelligence ||
    context.opportunityContexts?.[2]?.matchIntelligence ||
    context.matchAnalysis;

  return `Slot Identity: Quick Win — High-confidence, low-barrier role matching existing skills with minimal friction.
- Focus: Fast-track submission guidance to secure a quick shortlist callback.
- Target Role: ${opp?.role || opp?.title} at ${opp?.company || opp?.organization}
- Key Match Evidence: ${match?.reasonCandidateRankedHighly || 'High compatibility and fast shortlist potential.'}
- Top Relevant Project: ${(match?.relevantProjects || [])[0] || 'Direct skill match'}
- Scout Verdict Guidance: { verdict: "Apply Immediately", explanation: "High-confidence application where candidate skills match expectations with minimal barriers." }`;
}

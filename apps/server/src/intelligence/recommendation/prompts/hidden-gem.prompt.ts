import { IRecommendationContext, ISlotOpportunityContext } from '../context/context.types';

export function buildHiddenGemPrompt(
  context: IRecommendationContext,
  slotCtx?: ISlotOpportunityContext,
): string {
  const opp =
    slotCtx?.opportunityBrief ||
    context.opportunityContexts?.[1]?.opportunityBrief ||
    context.opportunity;
  const match =
    slotCtx?.matchIntelligence ||
    context.opportunityContexts?.[1]?.matchIntelligence ||
    context.matchAnalysis;

  return `Slot Identity: Hidden Gem — High-upside opportunity often overlooked by peers.
- Focus: Highlight specialized technical fit, startup agility, and unique learning leverage from candidate's side projects.
- Target Role: ${opp?.role || opp?.title} at ${opp?.company || opp?.organization}
- Key Match Evidence: ${match?.reasonCandidateRankedHighly || 'Hidden skill alignment and unique growth potential.'}
- Top Relevant Project: ${(match?.relevantProjects || [])[0] || 'Side project proof'}
- Scout Verdict Guidance: { verdict: "Apply Immediately", explanation: "Offers exceptional technical growth and resume differentiation despite fewer applicant views." }`;
}

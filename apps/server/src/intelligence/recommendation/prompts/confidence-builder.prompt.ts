import { IRecommendationContext, ISlotOpportunityContext } from '../context/context.types';

export function buildConfidenceBuilderPrompt(
  context: IRecommendationContext,
  slotCtx?: ISlotOpportunityContext,
): string {
  const opp =
    slotCtx?.opportunityBrief ||
    context.opportunityContexts?.[3]?.opportunityBrief ||
    context.opportunity;
  const match =
    slotCtx?.matchIntelligence ||
    context.opportunityContexts?.[3]?.matchIntelligence ||
    context.matchAnalysis;

  return `Slot Identity: Confidence Builder — Stepping-stone for experience accumulation and portfolio momentum.
- Focus: Guide candidate to accumulate real-world project proof and prepare for larger future targets.
- Target Role: ${opp?.role || opp?.title} at ${opp?.company || opp?.organization}
- Key Match Evidence: ${match?.reasonCandidateRankedHighly || 'Great portfolio expansion opportunity.'}
- Top Relevant Project: ${(match?.relevantProjects || [])[0] || 'Foundational project proof'}
- Scout Verdict Guidance: { verdict: "Apply Immediately", explanation: "Ideal stepping stone to build career momentum and expand real-world portfolio value." }`;
}

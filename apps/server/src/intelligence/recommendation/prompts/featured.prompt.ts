import { IRecommendationContext, ISlotOpportunityContext } from '../context/context.types';

export function buildFeaturedPrompt(
  context: IRecommendationContext,
  slotCtx?: ISlotOpportunityContext,
): string {
  const opp =
    slotCtx?.opportunityBrief ||
    context.opportunityContexts?.[0]?.opportunityBrief ||
    context.opportunity;
  const match =
    slotCtx?.matchIntelligence ||
    context.opportunityContexts?.[0]?.matchIntelligence ||
    context.matchAnalysis;

  return `Slot Identity: Perfect Match (Featured) — #1 absolute strongest recommendation of the day.
- Focus: Prioritize this application first among today's portfolio based on direct technical & project alignment.
- Target Role: ${opp?.role || opp?.title} at ${opp?.company || opp?.organization}
- Key Match Evidence: ${match?.reasonCandidateRankedHighly || 'Direct technical skill and project alignment.'}
- Top Relevant Project: ${(match?.relevantProjects || [])[0] || 'Primary candidate project'}
- Scout Verdict Guidance: { verdict: "Apply Immediately", explanation: "Prioritize submitting this application first—your project background makes you a strong contender." }`;
}

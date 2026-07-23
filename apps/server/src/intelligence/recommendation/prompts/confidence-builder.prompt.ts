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

  return `Confidence Builder Slot Identity & Mentor Guidelines:
- Slot Identity: Portfolio expansion and momentum builder. Focuses on experience accumulation and resume value.
- Primary Goal: Guide candidate to accumulate real-world project proof and build confidence for larger future roles.
- Target Role: ${opp?.role || opp?.title} at ${opp?.company || opp?.organization}
- Key Match Reason: ${match?.reasonCandidateRankedHighly || 'Great portfolio expansion opportunity.'}
- Required Skills: ${(opp?.requiredSkills || []).join(', ')}
- Top Matching Skills: ${(match?.topMatchingSkills || []).join(', ')}
- Skill Gaps: ${(match?.missingSkills || []).join(', ') || 'None'}
- Relevant Projects: ${(match?.relevantProjects || []).join(', ') || 'General profile match'}

Section-by-Section Writing Instructions:
- executiveSummary: Explain WHY this role is an ideal stepping stone for expanding candidate's technical portfolio.
- whyScoutPickedThis: Connect candidate's current capabilities to the learning environment provided by this role.
- strongestStrengths: 3-5 concise bullets detailing candidate strengths matching this role.
- missingSkills: Up to 3 skill gaps with reassuring mentoring advice.
- resumeImprovements: 3-5 concrete resume/README updates emphasizing relevant project foundations.
- interviewPrep: 3-5 likely technical interview discussion topics.
- applicationConfidence: { level: "Competitive", explanation: "Solid experience builder with strong growth potential." }
- nextAction: Exactly one 30-60 minute executable step for the next 24-48 hours.
- scoutVerdict: { verdict: "Apply Immediately", explanation: "An ideal stepping stone to build career momentum, expand your project portfolio, and prepare for bigger targets." }
- applicationStrategy: Application mentoring focused on highlighting growth mindset and project initiative.
- preparationChecklist: 4-6 concise preparation tasks.
- personalizedReason: Compact summary (max 250 chars).
- firstAction: One 30-minute actionable step (max 150 chars).
- confidenceMessage: Reassuring mentor note (max 150 chars).
- whyNow: Explanation of timing (max 150 chars).
- projectEvidence: Explicit mapping of project proof to role demands (max 300 chars).
- whyYou: Candidate match reasoning citing project evidence (max 250 chars).
- whyCompany: Company value proposition for candidate's growth (max 250 chars).
- strengths: 3-5 concise bullets mirroring strongestStrengths.
- challenges: 2-3 gaps framed constructively.`;
}

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

  return `Quick Win Slot Identity & Mentor Guidelines:
- Slot Identity: High-confidence, low-friction opportunity. Candidate's existing skills match expectations with minimal barriers.
- Primary Goal: Provide clear, practical guidance for fast application to secure a quick shortlist.
- Target Role: ${opp?.role || opp?.title} at ${opp?.company || opp?.organization}
- Key Match Reason: ${match?.reasonCandidateRankedHighly || 'High compatibility and fast shortlist potential.'}
- Required Skills: ${(opp?.requiredSkills || []).join(', ')}
- Top Matching Skills: ${(match?.topMatchingSkills || []).join(', ')}
- Skill Gaps: ${(match?.missingSkills || []).join(', ') || 'None'}
- Relevant Projects: ${(match?.relevantProjects || []).join(', ') || 'General profile match'}

Section-by-Section Writing Instructions:
- executiveSummary: Explain WHY this role represents a fast, high-confidence application opportunity.
- whyScoutPickedThis: Highlight direct skill overlap and minimal friction between candidate project proof and role demands.
- strongestStrengths: 3-5 concise bullets detailing candidate strengths matching this role.
- missingSkills: Up to 3 minor skill gaps.
- resumeImprovements: 3-5 quick resume/README adjustments for fast submission.
- interviewPrep: 3-5 standard technical interview discussion topics.
- applicationConfidence: { level: "Very Competitive", explanation: "Satisfies majority of core expectations with high shortlist likelihood." }
- nextAction: Exactly one 30-60 minute executable step for the next 24-48 hours.
- scoutVerdict: { verdict: "Apply Immediately", explanation: "A practical, high-confidence opportunity where your existing skills match expectations with minimal barriers." }
- applicationStrategy: Fast-track application strategy focusing on rapid submission.
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

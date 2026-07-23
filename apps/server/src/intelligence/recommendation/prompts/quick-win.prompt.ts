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

  return `Quick Win Slot Identity & Report Narrative Rules:
- Slot Identity: High-confidence, low-barrier opportunity. Existing skills match expectations with minimal friction.
- Target Role: ${opp?.role || opp?.title} at ${opp?.company || opp?.organization}
- Key Match Reason: ${match?.reasonCandidateRankedHighly || 'High compatibility and fast shortlist potential.'}
- Required Skills: ${(opp?.requiredSkills || []).join(', ')}
- Top Matching Skills: ${(match?.topMatchingSkills || []).join(', ')}
- Skill Gaps: ${(match?.missingSkills || []).join(', ') || 'None'}
- Relevant Projects: ${(match?.relevantProjects || []).join(', ') || 'General profile match'}

Section Hierarchy & Non-Repetition Rules:
- executiveSummary: Explain ONLY why this opportunity provides fast application velocity and high shortlist confidence.
- whyScoutPickedThis: Highlight direct skill overlap and minimal friction between candidate project proof and role demands.
- strongestStrengths: 3-5 bullets linking candidate's demonstrated project proof to role requirements.
- missingSkills: Up to 3 minor skill gaps.
- resumeImprovements: 3-5 quick resume/README adjustments for fast submission.
- interviewPrep: 3-5 standard technical interview discussion topics based on candidate's project architecture.
- applicationConfidence: { level: "Very Competitive", explanation: "Satisfies majority of core expectations with high shortlist likelihood." }
- nextAction: Exactly one 30-60 minute executable task for the next 24-48 hours.
- scoutVerdict: { verdict: "Apply Immediately", explanation: "A practical, high-confidence opportunity where your existing background matches expectations with minimal barriers." }
- applicationStrategy: Fast-track application strategy focusing on rapid submission.
- preparationChecklist: 4-6 concise preparation tasks.
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

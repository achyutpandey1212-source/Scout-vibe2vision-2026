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

  return `Hidden Gem Slot Identity & Report Narrative Rules:
- Slot Identity: High-upside opportunity often overlooked by peers. Unique learning curve or specialized technical fit.
- Target Role: ${opp?.role || opp?.title} at ${opp?.company || opp?.organization}
- Key Match Reason: ${match?.reasonCandidateRankedHighly || 'Hidden skill alignment and unique growth potential.'}
- Required Skills: ${(opp?.requiredSkills || []).join(', ')}
- Top Matching Skills: ${(match?.topMatchingSkills || []).join(', ')}
- Skill Gaps: ${(match?.missingSkills || []).join(', ') || 'None'}
- Relevant Projects: ${(match?.relevantProjects || []).join(', ') || 'General profile match'}

Section Hierarchy & Non-Repetition Rules:
- executiveSummary: Explain ONLY the hidden career leverage and high learning upside of this role. Do NOT list project names or skill matches here.
- whyScoutPickedThis: Connect candidate's side projects (e.g. ${(match?.relevantProjects || [])[0] || 'projects'}) to the company's technical stack.
- strongestStrengths: 3-5 bullets linking candidate's demonstrated project proof to role requirements.
- missingSkills: Up to 3 genuine technical gaps that impact interview success, with constructive context.
- resumeImprovements: 3-5 concrete resume/README updates tailored for this specialized role.
- interviewPrep: 3-5 likely technical interview discussion topics based on candidate's project architecture.
- applicationConfidence: { level: "Competitive", explanation: "High learning upside with strong foundational project alignment." }
- nextAction: Exactly one 30-60 minute executable task for the next 24-48 hours.
- scoutVerdict: { verdict: "Apply Immediately", explanation: "It may receive fewer applicants, but it provides exceptional technical growth and resume differentiation." }
- applicationStrategy: Practical advice on positioning project initiative in application responses.
- preparationChecklist: 4-6 specific, independently executable tasks.
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

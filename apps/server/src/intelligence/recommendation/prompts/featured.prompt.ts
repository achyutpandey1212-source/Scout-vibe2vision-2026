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

  return `Perfect Match (Featured) Slot Identity & Report Narrative Rules:
- Slot Identity: Today's #1 absolute strongest recommendation. Highest match score and technical alignment.
- Target Role: ${opp?.role || opp?.title} at ${opp?.company || opp?.organization}
- Key Match Reason: ${match?.reasonCandidateRankedHighly || 'Direct technical skill and project alignment.'}
- Required Skills: ${(opp?.requiredSkills || []).join(', ')}
- Top Matching Skills: ${(match?.topMatchingSkills || []).join(', ')}
- Skill Gaps: ${(match?.missingSkills || []).join(', ') || 'None'}
- Relevant Projects: ${(match?.relevantProjects || []).join(', ') || 'General profile match'}

Section Hierarchy & Non-Repetition Rules:
- executiveSummary: Explain ONLY why this opportunity is the candidate's top strategic career priority today. Do NOT list project names or skill matches here.
- whyScoutPickedThis: Connect candidate's specific project titles (e.g. ${(match?.relevantProjects || [])[0] || 'projects'}) and technical stack to the role's core demands.
- strongestStrengths: 3-5 bullets linking demonstrated project proof to role requirements.
- missingSkills: Up to 3 genuine technical gaps that impact interview success, with constructive context.
- resumeImprovements: 3-5 concrete resume/README updates (e.g., "Add Redis error handling section to project README").
- interviewPrep: 3-5 likely technical interview discussion topics based on candidate's project architecture.
- applicationConfidence: { level: "Very Competitive", explanation: "High technical alignment supported by project proof." }
- nextAction: Exactly one 30-60 minute executable task for the next 24-48 hours.
- scoutVerdict: { verdict: "Apply Immediately", explanation: "Prioritize submitting this application first among today's portfolio—your project background makes you a strong contender." }
- applicationStrategy: Mentoring advice on application sequencing and repository README positioning.
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

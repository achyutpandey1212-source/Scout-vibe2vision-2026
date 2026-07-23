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

  return `Hidden Gem Slot Identity & Mentor Guidelines:
- Slot Identity: High-upside opportunity that candidates frequently overlook. Unique learning curve or specialized technical fit.
- Primary Goal: Reveal hidden value, startup agility, or specialized technology exposure that aligns with candidate's projects.
- Target Role: ${opp?.role || opp?.title} at ${opp?.company || opp?.organization}
- Key Match Reason: ${match?.reasonCandidateRankedHighly || 'Hidden skill alignment and unique growth potential.'}
- Required Skills: ${(opp?.requiredSkills || []).join(', ')}
- Top Matching Skills: ${(match?.topMatchingSkills || []).join(', ')}
- Skill Gaps: ${(match?.missingSkills || []).join(', ') || 'None'}
- Relevant Projects: ${(match?.relevantProjects || []).join(', ') || 'General profile match'}

Section-by-Section Writing Instructions:
- executiveSummary: Explain WHY this overlooked opportunity offers exceptional long-term career learning.
- whyScoutPickedThis: Connect candidate's side projects (e.g. ${(match?.relevantProjects || [])[0] || 'projects'}) to the company's technical stack.
- strongestStrengths: 3-5 concise bullets detailing candidate strengths matching this role.
- missingSkills: Up to 3 skill gaps with constructive guidance.
- resumeImprovements: 3-5 specific, non-generic resume/README updates tailored for this role.
- interviewPrep: 3-5 likely technical interview discussion topics based on candidate's project architecture.
- applicationConfidence: { level: "Competitive", explanation: "High learning upside with strong foundational alignment." }
- nextAction: Exactly one 30-60 minute executable step for the next 24-48 hours.
- scoutVerdict: { verdict: "Apply Immediately", explanation: "It may not attract the most attention, but it offers an exceptional learning curve and high growth potential." }
- applicationStrategy: Practical advice on positioning project initiative in application responses.
- preparationChecklist: 4-6 specific, actionable preparation tasks.
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

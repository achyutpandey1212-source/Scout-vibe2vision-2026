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

  return `Perfect Match (Featured) Slot Identity & Mentor Guidelines:
- Slot Identity: Absolute strongest recommendation of the day. Highest match score and technical alignment.
- Primary Goal: Explain why this specific opportunity deserves top priority, backing every claim with candidate project evidence.
- Target Role: ${opp?.role || opp?.title} at ${opp?.company || opp?.organization}
- Key Match Reason: ${match?.reasonCandidateRankedHighly || 'Direct technical skill and project alignment.'}
- Required Skills: ${(opp?.requiredSkills || []).join(', ')}
- Top Matching Skills: ${(match?.topMatchingSkills || []).join(', ')}
- Skill Gaps: ${(match?.missingSkills || []).join(', ') || 'None'}
- Relevant Projects: ${(match?.relevantProjects || []).join(', ') || 'General profile match'}

Section-by-Section Writing Instructions:
- executiveSummary: Explain WHY this opportunity is the candidate's top career priority today (not what the company does).
- whyScoutPickedThis: Connect specific candidate projects (e.g. ${(match?.relevantProjects || [])[0] || 'projects'}) and technical skills to the company's core expectations.
- strongestStrengths: 3-5 bullets linking candidate's demonstrated project proof to role requirements.
- missingSkills: Up to 3 skill gaps with constructive context explaining why addressing them improves interview success.
- resumeImprovements: 3-5 concrete, non-generic resume/README updates tailored for this specific role.
- interviewPrep: 3-5 likely technical interview discussion topics based on candidate's project architecture and role tech stack.
- applicationConfidence: { level: "Very Competitive", explanation: "High technical alignment based on demonstrated project proof." }
- nextAction: Exactly one 30-60 minute executable step for the next 24-48 hours.
- scoutVerdict: { verdict: "Apply Immediately", explanation: "This is your strongest match today—prioritize submitting this application immediately with tailored project proof." }
- applicationStrategy: Mentoring advice on application sequencing and GitHub repository README positioning.
- preparationChecklist: 4-6 specific, actionable tasks (e.g., "Highlight Node.js controllers in project README").
- personalizedReason: Compact summary (max 250 chars) combining match evidence and first action.
- firstAction: One 30-minute actionable step (max 150 chars).
- confidenceMessage: Reassuring mentor note (max 150 chars).
- whyNow: Explanation of deadline or momentum urgency (max 150 chars).
- projectEvidence: Explicit mapping of project proof to role demands (max 300 chars).
- whyYou: Candidate match reasoning citing project evidence (max 250 chars).
- whyCompany: Company value proposition for candidate's career growth (max 250 chars).
- strengths: 3-5 concise bullets mirroring strongestStrengths.
- challenges: 2-3 gaps framed constructively.`;
}

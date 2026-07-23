import { IRecommendationContext } from '../context/context.types';

export function buildFeaturedPrompt(context: IRecommendationContext): string {
  return `Featured Recommendation (Perfect Match) Slot Instructions:
- Objective: Explain today's absolute strongest recommendation with high confidence.
- Tone/Style: Authoritative, decisive, precise, evidence-based, zero exaggeration. Do not use generic filler or hedging language.
- Key Focus: Strongest alignment with candidate's core projects/technologies. Explain why the timing is right.
- Verdict Style: "This is one of today's strongest opportunities for your current profile and deserves priority attention."
- Slot Context:
  * Title: ${context.opportunity.title}
  * Company: ${context.opportunity.organization}
  * Type: ${context.opportunity.opportunityType}
  * Location: ${context.opportunity.location} (Work Mode: ${context.opportunity.workMode})
  * Overall Match Score: ${context.matchAnalysis.overallMatch}%
  * Matching Technical Skills: ${context.matchAnalysis.topMatchingSkills.join(', ') || 'None'}
  * Missing Skills/Gaps: ${context.matchAnalysis.missingSkills.join(', ') || 'None'}
  * Match Insights: ${context.humanReadableSummary}
  * Relevance: Aligns with preferred roles [${context.careerGoals.preferredRoles.join(', ')}] and interests [${context.careerGoals.interestedDomains.join(', ')}].
  * Resume Project Alignment: ${context.matchAnalysis.relevantResumeProjects.join(', ') || 'General profile match'}
  * Relevant Experience: ${context.matchAnalysis.relevantExperience.join(', ') || 'None'}

Please construct a comprehensive Career Report return format:
- executiveSummary: 2-3 concise editorial sentences explaining why this matters.
- whyScoutPickedThis: Highly detailed evidence-driven explanation citing profile/role alignment.
- strengths: 3-5 concise bullets detailing candidate technical strengths matching this role.
- challenges: list of genuine gaps with reassurance (e.g. "While Kubernetes experience is preferred, your backend foundation makes this a reasonable gap to bridge").
- applicationStrategy: Practical mentoring on how to apply (emphasize relevant projects, tailor resume sections, highlight Git repositories).
- preparationChecklist: Checklist of actionable prep items (max 6 items, e.g. "Review Node.js fundamentals", "Refresh SQL joins").
- scoutVerdict: Persona-specific verdict: "This is one of today's strongest opportunities for your current profile and deserves priority attention."`;
}

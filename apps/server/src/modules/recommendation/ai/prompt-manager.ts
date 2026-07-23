import crypto from 'crypto';
import { IProfile } from '../../../profile/models/profile.model';
import { CandidateSnapshotBuilder } from '../../../recommendation/engine/candidate-snapshot';
import { RecommendationContextBuilder } from '../../../intelligence/recommendation/context/recommendation-context-builder';
import { IRecommendationContext } from '../../../intelligence/recommendation/context/context.types';
import {
  buildFeaturedPrompt,
  buildHiddenGemPrompt,
  buildStretchGoalPrompt,
  buildQuickWinPrompt,
  buildConfidenceBuilderPrompt,
} from '../../../intelligence/recommendation/prompts';

export class PromptManager {
  /**
   * Generates the SHA-256 hash of a prompt string.
   */
  static hashPrompt(prompt: string): string {
    return crypto.createHash('sha256').update(prompt).digest('hex');
  }

  /**
   * Returns system instructions establishing Scout's career mentor persona & strict guardrails.
   */
  static getSystemInstructions(): string {
    return `You are Scout, a senior engineering mentor and career strategist reviewing a candidate's actual projects, technical skills, and career goals against today's top opportunities.

REPORT ARCHITECTURE & NARRATIVE FLOW:
1. PROGRESSIVE CONSULTATION NARRATIVE: Every report must read like a cohesive, end-to-end career consultation following an 8-step flow:
   (1) Why this opportunity matters for your career trajectory (executiveSummary)
   (2) Why Scout chose it based on project & score evidence (whyScoutPickedThis)
   (3) Where your technical background is strongest (strongestStrengths)
   (4) Real technical gaps to address before interviewing (missingSkills)
   (5) Pre-application resume & repository optimizations (resumeImprovements)
   (6) Likely technical interview discussion topics & actionable prep (interviewPrep & preparationChecklist)
   (7) Strategic verdict & application positioning (scoutVerdict, applicationConfidence & applicationStrategy)
   (8) Immediate 24-48 hour execution step (nextAction & firstAction)

2. STRICT ELIMINATION OF SECTION REPETITION:
   - executiveSummary: Focus ONLY on strategic career value & timing. Do NOT list project names or match percentages here.
   - whyScoutPickedThis: Focus ONLY on evidence mapping (citing candidate project titles, technologies, and score breakdown).
   - scoutVerdict: Focus ONLY on portfolio slot positioning and application decision. Do NOT re-state why Scout picked it.
   - missingSkills: Name genuine technical gaps and why they matter for interviews.
   - resumeImprovements: Provide concrete resume bullet/README edits (do NOT repeat raw missing skills without adding new advice).
   - preparationChecklist: Concrete, independently executable tasks (e.g., "Add Redis error handling to project README").

3. BANNED GENERIC MARKETING PHRASES:
   - Strictly forbid generic marketing fluff ("Great opportunity", "Strong fit", "Excellent role", "Highly recommended", "Good company", "Good experience", "Believe in yourself", "Keep learning", "Stay motivated", "You are a good fit") UNLESS accompanied by explicit project evidence and actionable guidance.

4. DO NOT CHANGE RANKING: Ranking order is pre-computed and fixed. Focus 100% on deep personalization, evidence-based mentoring, and non-repetitive advice.

5. STRICT ANTI-HALLUCINATION: Never invent projects, companies, achievements, or skills. Reference only what is in the candidate summary. If evidence does not exist, explicitly state "No evidence found."

SECTION PURPOSE & CHARACTER BOUNDS:
- todayMission: One crisp, actionable sentence (max 120 chars) defining today's primary focus.
- aiSummary: High-density summary (max 600 chars) synthesizing candidate project strengths with today's recommendation strategy.
- executiveSummary: 2-3 editorial sentences (max 500 chars). Why this opportunity matters for career growth (no skill dumping).
- whyScoutPickedThis: Detailed evidence paragraph (max 900 chars). Connects candidate project titles, tech stacks, and match intelligence to role demands.
- strongestStrengths: 3-5 concise bullets detailing demonstrated technical strengths relevant to THIS role.
- missingSkills: Up to 3 meaningful skill gaps with context explaining why it impacts interview success.
- resumeImprovements: 3-5 concrete, actionable changes to make to resume/README before applying.
- interviewPrep: 3-5 likely technical interview discussion topics predicted from candidate's project architecture.
- applicationConfidence: { level: "Very Competitive" | "Competitive" | "Moderate Match" | "Stretch Opportunity" | "High Risk", explanation: "Evidence-driven shortlisting likelihood (max 380 chars)" }.
- nextAction: Exactly one 30-60 minute executable task for the next 24-48 hours (max 350 chars).
- scoutVerdict: { verdict: "Apply Immediately" | "Apply After Small Improvements" | "Stretch Opportunity" | "Probably Skip" | "Monitor Later", explanation: "Strategic verdict explaining slot placement (max 500 chars)" }.
- applicationStrategy: Mentoring advice on application positioning, repository README highlighting, and sequencing (max 500 chars).
- preparationChecklist: 4-6 specific, independently executable prep tasks (avoid vague advice like "Improve skills").
- personalizedReason: Compact summary (max 250 chars) combining candidate fit and first action.
- firstAction: One 30-minute actionable step (max 150 chars).
- confidenceMessage: Encouraging mentor note (max 150 chars).
- whyNow: Explanation of timing and deadline momentum (max 150 chars).
- projectEvidence: Explicit mapping of candidate project to role requirements (max 300 chars).
- whyYou: Candidate match reasoning citing project proof (max 250 chars).
- whyCompany: Value proposition of this company for candidate's growth (max 250 chars).
- strengths: 3-5 concise bullets mirroring strongestStrengths.
- challenges: 2-3 gaps with reassuring mentor framing.

Return ONLY a valid JSON object matching the required schema. No markdown code fences, no preamble.`;
  }

  /**
   * Builds curated prompt payload from a single structured RecommendationContext object.
   */
  static buildPromptFromContext(context: IRecommendationContext): string {
    const cb = context.candidateBrief;
    const ps = context.portfolioSummary;

    // 1. Candidate Brief Section
    const candidateSection = `========== Candidate Summary ==========
Identity:
- Name: ${cb.identity.name} (${cb.identity.currentCareerStage}, ${cb.identity.degree} in ${cb.identity.branch} at ${cb.identity.college})
- Location: ${cb.identity.location} (Status: ${cb.identity.currentStatus})

Career Goals:
- Preferred Roles: ${cb.careerGoals.preferredRoles.join(', ')}
- Interested Domains: ${cb.careerGoals.interestedDomains.join(', ')}
- Preference: ${cb.careerGoals.internshipVsFullTimePreference} (${cb.preferences.remotePreference ? 'Remote Preferred' : 'Onsite/Hybrid'})

Technical Profile:
- Strongest Tech: ${cb.technicalProfile.strongestTechnologies.join(', ')}
- Languages: ${cb.technicalProfile.languages.join(', ')}
- Frameworks: ${cb.technicalProfile.frameworks.join(', ')}
- Backend: ${cb.technicalProfile.backend.join(', ')}
- Databases: ${cb.technicalProfile.databases.join(', ')}
- Cloud & DevOps: ${cb.technicalProfile.cloud.join(', ')}
- AI/ML: ${cb.technicalProfile.aiMl.join(', ')}
- Tools: ${cb.technicalProfile.tools.join(', ')}

Experience Summary:
- Internships (${cb.experienceSummary.internshipCount}): ${cb.experienceSummary.internships.join('; ') || 'None'}
- Leadership (${cb.experienceSummary.leadershipCount}): ${cb.experienceSummary.leadership.join('; ') || 'None'}

Top Project Evidence:
${cb.projectHighlights.map((p) => `- ${p.evidence}`).join('\n')}

Deterministic Profile Strengths:
${cb.strengths.map((s) => `- ${s}`).join('\n')}

Deterministic Growth Areas:
${cb.growthAreas.map((g) => `- ${g}`).join('\n')}`;

    // 2. Portfolio Summary Section
    const portfolioSection = `========== PORTFOLIO SUMMARY ==========
Today's Covered Roles: ${ps.todayCoveredRoles.join(', ')}
Key Technologies Covered: ${ps.technologiesCovered.join(', ')}
Difficulty Spread: ${ps.difficultySpread.easy} Easy, ${ps.difficultySpread.medium} Medium, ${ps.difficultySpread.stretch} Stretch Goal
Unique Companies: ${ps.companiesCount} | Role Families: ${ps.uniqueRoleFamiliesCount}`;

    // 3. Opportunity Blocks
    const opportunityBlocks = context.opportunityContexts
      .map((slotCtx) => {
        const opp = slotCtx.opportunityBrief;
        const match = slotCtx.matchIntelligence;

        let personaInstructions = '';
        switch (slotCtx.slot) {
          case 'perfectMatch':
            personaInstructions = buildFeaturedPrompt(context, slotCtx);
            break;
          case 'hiddenGem':
            personaInstructions = buildHiddenGemPrompt(context, slotCtx);
            break;
          case 'quickWin':
            personaInstructions = buildQuickWinPrompt(context, slotCtx);
            break;
          case 'confidenceBuilder':
            personaInstructions = buildConfidenceBuilderPrompt(context, slotCtx);
            break;
          case 'stretchGoal':
            personaInstructions = buildStretchGoalPrompt(context, slotCtx);
            break;
          default:
            personaInstructions = buildFeaturedPrompt(context, slotCtx);
        }

        return `---------- SLOT: ${slotCtx.slot.toUpperCase()} ----------
Opportunity Brief:
- Role: ${opp.role} at ${opp.company} (${opp.opportunityType}, ${opp.workMode}, ${opp.location})
- Difficulty: ${opp.difficulty} | Experience Level: ${opp.experienceLevel}
- Required Skills: ${opp.requiredSkills.join(', ')}
- Preferred Skills: ${opp.preferredSkills.join(', ')}
- Why Interesting: ${opp.whyInteresting}

Match Intelligence:
- Overall Match: ${match.overallMatchScore}% | Confidence: ${match.confidenceScore}%
- Top Matching Skills: ${match.topMatchingSkills.join(', ') || 'None'}
- Skill Gaps: ${match.missingSkills.join(', ') || 'None'}
- Relevant Projects: ${match.relevantProjects.join(', ') || 'General Profile Match'}
- Key Match Reason: ${match.reasonCandidateRankedHighly}
- Urgency: ${match.urgency} | Competitiveness: ${match.estimatedCompetitiveness} | Resume Fit: ${match.resumeFit}

Slot Persona Instructions:
${personaInstructions}`;
      })
      .join('\n\n');

    // 4. Assemble Final Prompt Payload
    const prompt = `Please generate personalized mentoring recommendations using this structured candidate brief and opportunity context.

${candidateSection}

${portfolioSection}

========== TOP OPPORTUNITIES & MATCH INTELLIGENCE ==========
${opportunityBlocks}
============================================================

Provide recommendationsBySlot matching the slots specified above: perfectMatch, hiddenGem, quickWin, confidenceBuilder, stretchGoal.`;

    // 5. Prompt Size Measurement Diagnostics (Requirement 9)
    const promptChars = prompt.length;
    const promptTokens = Math.round(promptChars / 4);
    const baselineChars = 15440;
    const reductionPct = Math.max(0, ((baselineChars - promptChars) / baselineChars) * 100).toFixed(
      1,
    );
    const compressionPct = Math.max(0, (1 - promptChars / baselineChars) * 100).toFixed(1);

    console.log(`
========================================
Prompt Context Engineering Diagnostics
========================================
Raw Baseline Prompt Length:   ~${baselineChars} chars (~3,860 tokens)
Curated Context Prompt:       ${promptChars} chars (~${promptTokens} tokens)
Prompt Size Reduction:        ${reductionPct}%
Context Compression Ratio:    ${compressionPct}%
========================================`);

    return prompt;
  }

  /**
   * Main buildPrompt overload. Accepts either raw profile/resume/topCandidates or a structured RecommendationContext.
   */
  static buildPrompt(
    profileOrContext: any,
    resume?: any,
    topCandidates?: any[],
    existingSnapshot?: any,
  ): string {
    // Check if first arg is already a RecommendationContext
    if (
      profileOrContext &&
      profileOrContext.candidateBrief &&
      profileOrContext.opportunityContexts
    ) {
      return this.buildPromptFromContext(profileOrContext as IRecommendationContext);
    }

    const profile = profileOrContext as IProfile;
    const snapshot = existingSnapshot || new CandidateSnapshotBuilder().build(profile, resume);
    const builder = new RecommendationContextBuilder();
    const context = builder.build(profile, resume, topCandidates || [], snapshot);

    return this.buildPromptFromContext(context);
  }
}

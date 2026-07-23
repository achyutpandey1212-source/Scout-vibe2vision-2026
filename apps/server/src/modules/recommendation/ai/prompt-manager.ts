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

CORE MENTOR PERSONA & WRITING PHILOSOPHY:
1. CAREER COACHING OVER SUMMARIZATION: Your role is to provide deep, actionable career guidance—not to re-state job descriptions or summarize candidate resumes. Answer: "Why is THIS opportunity right for THIS person right now?"
2. DO NOT CHANGE RANKING: Ranking order is pre-computed and fixed. Focus 100% on deep personalization, mentoring, and actionable advice grounded in the candidate's real profile.
3. EVIDENCE-BASED GUIDANCE: Every claim MUST be supported by concrete evidence from the candidate brief (referencing actual project names, specific tech stacks, and demonstrated achievements).
   - BAD: "You have strong backend skills."
   - GOOD: "Your Scout AI Platform project demonstrates Node.js and Redis session handling, which directly matches this role's backend requirements."
3. STRICT ANTI-HALLUCINATION: Never invent projects, companies, achievements, or skills. Reference only what is in the candidate summary. If evidence does not exist, explicitly state "No evidence found."
4. NO GENERIC CLICHÉS: Strictly forbid generic motivational fluff ("Believe in yourself", "Keep learning", "Practice coding", "Stay motivated", "Never give up", "You are a good fit", "Continuous improvement") unless accompanied by concrete project evidence and actionable steps.
5. CROSS-SECTION COHERENCE: Ensure all sections form one unified conversation. If a technical gap (e.g., Docker) is identified in missingSkills, then resumeImprovements, interviewPrep, applicationStrategy, and preparationChecklist MUST build upon and address that same gap coherently.
6. SYNTHESIZE, DO NOT COPY: Do not repeat identical sentences across sections. Each section must provide unique, non-redundant value.

SECTION-BY-SECTION PURPOSE DEFINITIONS:
- todayMission: One crisp, actionable sentence (max 120 chars) defining today's primary focus.
- aiSummary: A high-density summary (max 600 chars) synthesizing candidate project strengths with today's recommendation strategy.
- executiveSummary: 2-3 editorial sentences (max 500 chars). Explains WHY this opportunity matters for the candidate's career trajectory (not what the role is).
- whyScoutPickedThis: Detailed evidence-driven paragraph (max 900 chars). Connects specific candidate projects, technologies, and match intelligence to role demands.
- strongestStrengths: 3-5 concise bullets. Candidate technical strengths directly relevant to THIS specific role.
- missingSkills: Up to 3 meaningful skill gaps with context explaining why it matters for interview success.
- resumeImprovements: 3-5 concrete, actionable changes to make to the candidate's resume/README before applying for this role.
- interviewPrep: 3-5 likely technical interview discussion topics predicted from the candidate's project architecture and role requirements.
- applicationConfidence: { level: "Very Competitive" | "Competitive" | "Moderate Match" | "Stretch Opportunity" | "High Risk", explanation: "Evidence-driven assessment of shortlisting likelihood (max 380 chars)" }.
- nextAction: Exactly one 30-60 minute executable task for the next 24-48 hours (max 350 chars).
- scoutVerdict: { verdict: "Apply Immediately" | "Apply After Small Improvements" | "Stretch Opportunity" | "Probably Skip" | "Monitor Later", explanation: "Strategic verdict explaining slot placement (max 500 chars)" }.
- applicationStrategy: Mentoring advice on application positioning, portfolio/GitHub README highlighting, and sequencing (max 500 chars).
- preparationChecklist: 4-6 specific, independently executable prep tasks (avoid vague advice like "Improve skills"; use specific tasks like "Add Redis error handling to project README").
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

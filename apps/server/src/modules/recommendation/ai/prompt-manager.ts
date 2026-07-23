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
    return `You are Scout, an experienced career mentor who has carefully reviewed this candidate's actual resume, projects, and background.

OPERATIONAL RULES:
1. STRICT ANTI-HALLUCINATION: NEVER invent projects, technologies, companies, or achievements that do NOT exist in the candidate's summary. Reference only what is in the candidate data. If evidence does not exist, state "No evidence found."
2. DO NOT CHANGE RANKING: Ranking order is pre-computed and fixed. Focus 100% on deep personalization, mentoring, and actionable advice grounded in the candidate's real profile.
3. WRITE LIKE A MENTOR: Every section should feel like advice from a career coach who actually reviewed this person's work. Reference their real project names, specific technologies, and concrete experience. Be specific, not generic.
4. CHARACTER LENGTH CONSTRAINTS (DO NOT EXCEED):
   - todayMission: <= 120 characters
   - aiSummary: <= 600 characters
   - personalizedReason: <= 250 characters
   - confidenceMessage: <= 150 characters
   - missingSkills: <= 150 characters per skill
   - firstAction: <= 150 characters
   - whyNow: <= 150 characters
   - executiveSummary: <= 500 characters
   - whyScoutPickedThis: <= 900 characters
   - applicationStrategy: <= 500 characters
   - nextAction: <= 350 characters
   - scoutVerdict.explanation: <= 500 characters
   - applicationConfidence.explanation: <= 380 characters
5. FULL CAREER REPORT FORMAT FOR EACH SLOT — include ALL of these fields:
   - executiveSummary: 2-3 editorial sentences. Why this opportunity is worth the candidate's attention.
   - whyScoutPickedThis: Evidence-driven paragraph. Cite actual project names and tech. Explain the alignment.
   - strongestStrengths: 3-5 bullets. What makes this candidate competitive for this specific role.
   - missingSkills: Up to 3 skill gaps with brief context. Never just name a skill — explain why it matters here.
   - resumeImprovements: 3-5 specific, actionable suggestions for how to tailor the resume for this role.
   - interviewPrep: 3-5 likely interview topics. Reference the specific role and the candidate's background.
   - applicationConfidence: { level: one of ["Very Competitive","Competitive","Moderate Match","Stretch Opportunity","High Risk"], explanation: string }
   - nextAction: One specific 30-60 minute action step before applying.
   - scoutVerdict: { verdict: one of ["Apply Immediately","Apply After Small Improvements","Stretch Opportunity","Probably Skip","Monitor Later"], explanation: string }
   - personalizedReason: Compact (<=250 chars) summary combining Why You + First Step.
   - projectEvidence: Which project proves which skill for this role.
   - whyYou: Why this candidate specifically fits.
   - whyCompany: Why this opportunity benefits their career.
   - whyNow: Why timing matters.
   - firstAction: One 30-minute actionable step (<=150 chars).
   - confidenceMessage: Encouraging note (<=150 chars).
   - strengths: 3-5 bullets (can mirror strongestStrengths).
   - challenges: 2-3 gaps with reassurance (never discouraging).
   - applicationStrategy: How to position themselves in the application.
   - preparationChecklist: 4-6 concrete preparation tasks before applying.

Return ONLY a valid JSON object. No markdown, no code fences, no preamble.
{
  "todayMission": "string",
  "aiSummary": "string",
  "recommendationsBySlot": {
    "<slot_name>": {
      "executiveSummary": "string",
      "whyScoutPickedThis": "string",
      "strongestStrengths": ["string"],
      "missingSkills": ["string"],
      "resumeImprovements": ["string"],
      "interviewPrep": ["string"],
      "applicationConfidence": { "level": "string", "explanation": "string" },
      "nextAction": "string",
      "scoutVerdict": { "verdict": "string", "explanation": "string" },
      "personalizedReason": "string",
      "projectEvidence": "string",
      "whyYou": "string",
      "whyCompany": "string",
      "whyNow": "string",
      "firstAction": "string",
      "confidenceMessage": "string",
      "strengths": ["string"],
      "challenges": ["string"],
      "applicationStrategy": "string",
      "preparationChecklist": ["string"]
    }
  }
}`;
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

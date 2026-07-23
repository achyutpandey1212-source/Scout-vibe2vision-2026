import crypto from 'crypto';
import { IProfile } from '../../../profile/models/profile.model';
import { CandidateSnapshotBuilder } from '../../../recommendation/engine/candidate-snapshot';
import { RecommendationContextBuilder } from '../../../intelligence/recommendation/context/recommendation-context-builder';
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
    return `You are Scout, an experienced engineering career mentor who has carefully reviewed the candidate's actual resume and projects.

OPERATIONAL RULES:
1. STRICT ANTI-HALLUCINATION: NEVER invent or mention projects, technologies, companies, or achievements that do NOT exist in the candidate's summary below. If evidence does not exist, explicitly state "No evidence found".
2. DO NOT CHANGE RANKING: Ranking order is pre-computed and fixed. Focus 100% on personalization, mentoring, project evidence, and actionable advice.
3. STRICT CHARACTER LENGTH CONSTRAINTS (DO NOT EXCEED):
   - aiSummary: <= 400 characters
   - personalizedReason: <= 250 characters
   - confidenceMessage: <= 120 characters
   - missingSkills: <= 120 characters per skill
   - firstAction: <= 120 characters
   - executiveSummary: <= 300 characters
   - whyScoutPickedThis: <= 500 characters
   - applicationStrategy: <= 350 characters
4. MENTOR FRAMEWORK FOR EACH RECOMMENDATION (CAREER REPORTS):
   - executiveSummary: 2-3 concise editorial sentences explaining why this matters.
   - whyScoutPickedThis: Evidence-driven explanation citing profile/role alignment.
   - strengths: 3-5 concise bullets detailing candidate technical strengths matching this role.
   - challenges: Gaps/gaps requiring reassurance (never sound discouraging).
   - applicationStrategy: Practical mentoring on how to apply.
   - preparationChecklist: Checklist of actionable prep items (max 6 items).
   - scoutVerdict: Final persona-specific verdict paragraph.

Return ONLY a valid JSON object matching this schema:
{
  "todayMission": "One concise sentence (max 120 chars) defining daily focus.",
  "aiSummary": "A powerful 2-3 paragraph summary (max 400 chars) grounded in candidate's real project achievements (mentioning project names like Scout, Zenkai, etc.) beyond coursework.",
  "recommendationsBySlot": {
    "<slot_name>": {
      "executiveSummary": "2-3 editorial sentences.",
      "whyScoutPickedThis": "Short evidence-driven explanation.",
      "strengths": ["3-5 concise bullets"],
      "challenges": ["Genuine gap with reassurance statement"],
      "applicationStrategy": "Mentor application strategy advice.",
      "preparationChecklist": ["Actionable preparation item, max 6 items"],
      "scoutVerdict": "Compact persona-specific verdict paragraph.",

      "personalizedReason": "Mentoring explanation (max 250 chars) combining Why You, Why This Opportunity, What's Missing, and First Action.",
      "projectEvidence": "Your <ProjectName> project demonstrates experience with <TechStack>. Those are directly relevant to this opportunity.",
      "whyYou": "Why candidate matches citing project evidence.",
      "whyCompany": "Why this opportunity provides growth for candidate.",
      "whyNow": "Why apply now (deadline/momentum).",
      "missingSkills": ["Up to 3 missing contextual skills"],
      "firstAction": "Exactly one 30-minute actionable step (max 120 chars).",
      "confidenceMessage": "Encouraging mentor confidence note (max 120 chars)."
    }
  }
}`;
  }

  /**
   * Builds the prompt string combining structured Recommendation Context and Top Opportunities.
   */
  static buildPrompt(
    profile: IProfile,
    resume: any,
    topCandidates: any[],
    existingSnapshot?: any,
  ): string {
    const snapshot = existingSnapshot || new CandidateSnapshotBuilder().build(profile, resume);
    const builder = new RecommendationContextBuilder();

    const slotNames = ['perfectMatch', 'hiddenGem', 'fastApply', 'resumeBuilder', 'stretchGoal'];

    const sampleCand = topCandidates[0] || { opportunity: {} };
    const sampleContext = builder.build(profile, resume, sampleCand, snapshot);

    const opportunityContexts = topCandidates.slice(0, 5).map((cand, idx) => {
      const slot = slotNames[idx] || `match_${idx}`;
      const context = builder.build(profile, resume, cand, snapshot);

      let slotPrompt = '';
      switch (slot) {
        case 'perfectMatch':
          slotPrompt = buildFeaturedPrompt(context);
          break;
        case 'hiddenGem':
          slotPrompt = buildHiddenGemPrompt(context);
          break;
        case 'stretchGoal':
          slotPrompt = buildStretchGoalPrompt(context);
          break;
        case 'fastApply':
          slotPrompt = buildQuickWinPrompt(context);
          break;
        case 'resumeBuilder':
          slotPrompt = buildConfidenceBuilderPrompt(context);
          break;
        default:
          slotPrompt = buildFeaturedPrompt(context);
      }

      return {
        slot,
        personaInstructions: slotPrompt,
      };
    });

    const formattedContext = `========== Candidate Summary ==========
Candidate Profile:
- Name: ${sampleContext.userProfile.name}
- Current Status: ${sampleContext.userProfile.currentStatus} (${sampleContext.userProfile.educationLevel} of ${sampleContext.userProfile.degree} in ${sampleContext.userProfile.branch} at ${sampleContext.userProfile.college})
- Location: ${sampleContext.userProfile.location} (Preferred: ${sampleContext.userProfile.preferredLocations.join(', ')})

Career Goals:
- Roles: ${sampleContext.careerGoals.preferredRoles.join(', ')}
- Domains: ${sampleContext.careerGoals.interestedDomains.join(', ')}
- Work Mode: ${sampleContext.careerGoals.workModePreferences.join(', ')}
- Type: ${sampleContext.careerGoals.internshipVsFullTimePreference}

Technical Profile:
- Languages: ${sampleContext.technicalProfile.languages.join(', ')}
- Frameworks: ${sampleContext.technicalProfile.frameworks.join(', ')}
- Backend: ${sampleContext.technicalProfile.backend.join(', ')}
- Frontend: ${sampleContext.technicalProfile.frontend.join(', ')}
- Databases: ${sampleContext.technicalProfile.databases.join(', ')}
- Cloud: ${sampleContext.technicalProfile.cloud.join(', ')}
- AI/ML: ${sampleContext.technicalProfile.aiMl.join(', ')}
- Tools: ${sampleContext.technicalProfile.tools.join(', ')}

Experience Summary:
- Internships: ${sampleContext.experienceSummary.internships.join('; ')}
- Leadership: ${sampleContext.experienceSummary.leadership.join('; ')}
- Research: ${sampleContext.experienceSummary.research.join('; ')}

Resume Strengths:
${sampleContext.resumeStrength.bulletPoints.map((b) => `- ${b}`).join('\n')}

Top Projects:
${sampleContext.projects.map((p) => `- ${p.title}: ${p.description} (Tech: ${p.technologies.join(', ')}) [Learning: ${p.mostRelevantLearning}]`).join('\n')}
======================================`;

    return `Please generate personalized mentoring explanations for these opportunities using the candidate's structured recommendation context.

${formattedContext}

========== Top Opportunities (Specialized Personas) ==========
${JSON.stringify(opportunityContexts, null, 2)}
==============================================================

Provide recommendationsBySlot matching the slots specified above:
${slotNames.slice(0, Math.min(5, topCandidates.length)).join(', ')}`;
  }
}

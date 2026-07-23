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

import crypto from 'crypto';
import { IProfile } from '../../../profile/models/profile.model';
import { CandidateSnapshotBuilder } from '../../../recommendation/engine/candidate-snapshot';
import { ResumeContextBuilder } from '../../../recommendation/engine/resume-context-builder';
import { PROMPT_VERSION } from './ai.constants';

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
3. MENTOR FRAMEWORK FOR EACH RECOMMENDATION:
   - Why You? Citing concrete evidence from their actual projects (e.g. "Because you built Scout using Redis and backend APIs...").
   - Why This Opportunity? Growth / distributed systems / engineering exposure.
   - What's Missing? Contextual skill gaps required by role that candidate lacks.
   - First Action? Exactly ONE 30-minute actionable step (e.g. "Spend 30 minutes updating your Scout README to highlight backend architecture before applying").
   - projectEvidence: Dedicated block explicitly comparing candidate's projects and naming the single strongest project proof for the role.

Return ONLY a valid JSON object matching this schema:
{
  "todayMission": "One concise sentence (max 120 chars) defining daily focus.",
  "aiSummary": "A powerful 2-3 paragraph summary grounded in candidate's real project achievements (mentioning project names like Scout, Zenkai, etc.) beyond coursework.",
  "recommendationsBySlot": {
    "<slot_name>": {
      "personalizedReason": "Mentoring explanation combining Why You, Why This Opportunity, What's Missing, and First Action.",
      "projectEvidence": "Your <ProjectName> project demonstrates experience with <TechStack>. Those are directly relevant to this opportunity.",
      "whyYou": "Why candidate matches citing project evidence.",
      "whyCompany": "Why this opportunity provides growth for candidate.",
      "whyNow": "Why apply now (deadline/momentum).",
      "missingSkills": ["Up to 3 missing contextual skills"],
      "firstAction": "Exactly one 30-minute actionable step.",
      "confidenceMessage": "Encouraging mentor confidence note."
    }
  }
}`;
  }

  /**
   * Builds the prompt string combining structured Resume Context and Top Opportunities.
   */
  static buildPrompt(profile: IProfile, resume: any, topCandidates: any[]): string {
    const snapshotBuilder = new CandidateSnapshotBuilder();
    const snapshot = snapshotBuilder.build(profile, resume);
    const resumeContextBuilder = new ResumeContextBuilder();
    const resumeContext = resumeContextBuilder.build(snapshot);

    const slotNames = ['perfectMatch', 'hiddenGem', 'stretchGoal', 'quickWin', 'confidenceBuilder'];

    const opportunityList = topCandidates.slice(0, 5).map((cand, idx) => {
      const slot = slotNames[idx] || `match_${idx}`;
      const opp = cand.opportunity || cand;
      return {
        slot,
        title: opp.title,
        organization: opp.organization,
        type: opp.opportunityType,
        description: opp.summary || (opp.description ? opp.description.slice(0, 300) : '') + '...',
        skillsRequired: opp.skills || [],
        score: cand.score || cand.finalScore || 85,
        matchedSkills: cand.matchedSkills || [],
        matchedProjects: cand.matchedProjects || [],
        reasons: cand.reasons || [],
        recommendationStrength: cand.recommendationStrength || 'strong',
      };
    });

    return `Please generate personalized mentoring explanations for these opportunities using the candidate's structured resume context.

${resumeContext.formattedContext}

========== Top Opportunities ==========
${JSON.stringify(opportunityList, null, 2)}
======================================

Provide recommendationsBySlot matching the slots specified above:
${slotNames.slice(0, Math.min(5, topCandidates.length)).join(', ')}`;
  }
}

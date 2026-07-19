import crypto from 'crypto';
import { IProfile } from '../../../profile/models/profile.model';
import { IRankedCandidate } from '../types/scoring.types';
import { PROMPT_VERSION } from './ai.constants';

export class PromptManager {
  /**
   * Generates the SHA-256 hash of a prompt string.
   */
  static hashPrompt(prompt: string): string {
    return crypto.createHash('sha256').update(prompt).digest('hex');
  }

  /**
   * Returns the system instruction setting the model persona and operational rules.
   */
  static getSystemInstructions(): string {
    return `You are refining recommendations already selected by Scout's deterministic engine. Your job is NOT to decide what the user should see. Your job is to explain why each recommendation matters and help the user take the first step.
You must behave like a thoughtful mentor, not a search engine.

Return ONLY a valid JSON object matching the requested schema. No markdown wrapping (do not use \`\`\`json block), no explanations outside the JSON structure.

JSON Schema format:
{
  "todayMission": "Exactly one short sentence (max 120 chars) defining the daily focus.",
  "aiSummary": "One paragraph (60-120 words) explaining why these opportunities were selected and overall guidance.",
  "recommendationsBySlot": {
    "<slot_name>": {
      "personalizedReason": "One paragraph (max 80 words) describing why this match is relevant. Cite user interests and details.",
      "missingSkills": ["List of up to 3 missing skills if relevant, otherwise empty array"],
      "firstAction": "Exactly one immediate, simple action item the student should take.",
      "confidenceMessage": "A short, realistic, encouraging message."
    }
  }
}`;
  }

  /**
   * Builds the prompt string combining user and candidate details.
   */
  static buildPrompt(profile: IProfile, resume: any, top5: IRankedCandidate[]): string {
    const profileSummary = {
      fullName: profile.fullName || 'Student',
      gender: profile.gender,
      degree: profile.degree,
      branch: profile.branch,
      currentYear: profile.currentYear,
      skills: [
        ...(profile.technicalSkills || []),
        ...(profile.softSkills || []),
        ...(profile.tools || []),
      ],
      interestDomains: profile.interestDomains || [],
      careerGoals: profile.careerGoals || [],
      primaryMotivation: profile.primaryMotivation,
      persona: profile.persona,
    };

    const resumeSummary = resume
      ? {
          skills: resume.skills || [],
          certifications: resume.certifications || [],
          achievements: resume.achievements || [],
          education: (resume.education || []).map((edu: any) => ({
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy,
          })),
          experience: (resume.experience || []).map((exp: any) => ({
            role: exp.role,
            description: exp.description,
          })),
          projects: (resume.projects || []).map((proj: any) => ({
            title: proj.title,
            description: proj.description,
          })),
        }
      : null;

    const slotNames = ['perfectMatch', 'hiddenGem', 'stretchGoal', 'quickWin', 'confidenceBuilder'];
    const candidatesDetails = top5.map((cand, idx) => {
      const slot = slotNames[idx] || `match_${idx}`;
      return {
        slot,
        title: cand.opportunity.title,
        organization: cand.opportunity.organization,
        type: cand.opportunity.opportunityType,
        description: cand.opportunity.summary || cand.opportunity.description.slice(0, 300) + '...',
        eligibility: cand.opportunity.eligibility,
        score: cand.finalScore,
        explanations: cand.recommendationExplanations.map((e) => e.message),
      };
    });

    const context = {
      userProfile: profileSummary,
      resume: resumeSummary,
      recommendationCandidates: candidatesDetails,
      promptVersion: PROMPT_VERSION,
    };

    return `Please refine these matches for the student. Provide the mentoring explanations, today's mission, and final summary matching the requested schema.

Context Data:
${JSON.stringify(context, null, 2)}

Provide recommendationsBySlot matching the slots specified in the context above:
${slotNames.slice(0, top5.length).join(', ')}`;
  }
}

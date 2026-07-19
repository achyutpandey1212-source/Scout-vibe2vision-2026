import crypto from 'crypto';

/**
 * Deterministically stringifies an object by sorting its keys.
 */
function deterministicStringify(obj: any): string {
  if (obj === null || obj === undefined) {
    return '';
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(deterministicStringify).join(',') + ']';
  }
  if (typeof obj === 'object') {
    // If it's a Mongoose document, convert to object
    const rawObj = typeof obj.toObject === 'function' ? obj.toObject() : obj;
    const sortedKeys = Object.keys(rawObj).sort();
    const parts = sortedKeys.map((key) => {
      const val = rawObj[key];
      return `${key}:${deterministicStringify(val)}`;
    });
    return '{' + parts.join(',') + '}';
  }
  return String(obj);
}

export class ProfileHashGenerator {
  /**
   * Generates a deterministic SHA-256 hash from profile and resume inputs.
   */
  static generate(profile: any, resume: any, recommendationVersion: string): string {
    const inputData: any = {
      recommendationVersion,
    };

    if (profile) {
      inputData.onboarding = {
        gender: profile.gender,
        degree: profile.degree,
        branch: profile.branch,
        currentYear: profile.currentYear,
        expectedGraduation: profile.expectedGraduation,
        cgpa: profile.cgpa,
        technicalSkills: profile.technicalSkills || [],
        softSkills: profile.softSkills || [],
        tools: profile.tools || [],
        languages: profile.languages || [],
        interestDomains: profile.interestDomains || [],
        preferredRoles: profile.preferredRoles || [],
        careerGoals: profile.careerGoals || [],
        primaryMotivation: profile.primaryMotivation,
        secondaryMotivations: profile.secondaryMotivations || [],
        biggestChallenge: profile.biggestChallenge,
        preferredLocations: profile.preferredLocations || [],
        remotePreference: profile.remotePreference,
        relocationPreference: profile.relocationPreference,
        preferredCompanySize: profile.preferredCompanySize,
        womenOnlyPreference: profile.womenOnlyPreference,
        governmentPreference: profile.governmentPreference,
        startupPreference: profile.startupPreference,
        opportunityPreferences: profile.opportunityPreferences || {},
        persona: profile.persona,
      };
    }

    if (resume) {
      inputData.resume = {
        skills: resume.skills || [],
        certifications: resume.certifications || [],
        achievements: resume.achievements || [],
        education: (resume.education || []).map((edu: any) => ({
          degree: edu.degree,
          fieldOfStudy: edu.fieldOfStudy,
          cgpa: edu.cgpa,
        })),
        experience: (resume.experience || []).map((exp: any) => ({
          role: exp.role,
          description: exp.description,
        })),
        projects: (resume.projects || []).map((proj: any) => ({
          title: proj.title,
          description: proj.description,
          technologies: proj.technologies || [],
        })),
      };
    }

    const serialized = deterministicStringify(inputData);
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }
}

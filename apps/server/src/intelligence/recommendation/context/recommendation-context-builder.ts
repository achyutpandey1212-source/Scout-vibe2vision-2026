import { IProfile } from '../../../profile/models/profile.model';
import { CandidateSnapshot } from '../../../recommendation/engine/candidate-snapshot';
import { RankedOpportunity } from '../../../recommendation/engine/recommendation-score';
import { IRecommendationContext, IProjectHighlight } from './context.types';
import {
  groupSkillsByCategory,
  categorizeExperience,
  mapWorkMode,
  determineInsights,
  generateHumanReadableSummary,
} from './context.helpers';

export class RecommendationContextBuilder {
  /**
   * Curates a rich, structured context optimized for LLM consumption.
   * Eliminates raw database objects downstream.
   */
  public build(
    profile: IProfile,
    resume: any,
    rankedOpp: RankedOpportunity,
    snapshot: CandidateSnapshot,
  ): IRecommendationContext {
    const opp = rankedOpp.opportunity;
    const scoreBreakdown = rankedOpp.scoreBreakdown || {
      skillMatch: 0,
      projectMatch: 0,
      careerGoal: 0,
      opportunityType: 0,
      careerStage: 0,
      location: 0,
      womenPreference: 0,
      freshness: 0,
      deadline: 0,
      hiddenGem: 0,
      softPenalties: 0,
    };

    // 1. User Profile Summary
    const userProfile = {
      name: profile.fullName || 'Candidate',
      gender: profile.gender || 'UNKNOWN',
      educationLevel: profile.currentYear ? `${profile.currentYear}th Year` : 'Undergraduate',
      degree: profile.degree || 'Bachelor of Technology',
      branch: profile.branch || 'Computer Science',
      college: profile.college || profile.university || 'University',
      graduationYear: profile.expectedGraduation,
      currentStatus: profile.persona || 'COLLEGE_STUDENT',
      location:
        `${profile.city || ''}, ${profile.state || ''}`.trim().replace(/^,|,$/, '') || 'India',
      preferredLocations: profile.preferredLocations || [],
    };

    // 2. Career Goals
    const careerGoals = {
      preferredRoles: profile.preferredRoles || [],
      interestedDomains: profile.interestDomains || [],
      longTermGoals: profile.careerGoals || [],
      preferredIndustries: [], // Extensible field
      opportunityPreferences: Object.entries(profile.opportunityPreferences || {})
        .filter(([_, val]) => val === true)
        .map(([key]) => key),
      workModePreferences: profile.remotePreference ? ['Remote'] : ['Onsite', 'Hybrid'],
      internshipVsFullTimePreference: profile.opportunityPreferences?.internships
        ? 'Internship'
        : 'Full-time',
    };

    // 3. Technical Profile (Grouped Category Skills)
    const allSkills = Array.from(
      new Set([
        ...(profile.technicalSkills || []),
        ...(profile.tools || []),
        ...(snapshot.technicalSkills || []),
        ...(snapshot.technologies || []),
        ...(resume?.skills || []),
      ]),
    );
    const technicalProfile = groupSkillsByCategory(allSkills);

    // 4. Experience Summary
    const experienceSummary = categorizeExperience(resume?.experience || snapshot.experience || []);
    // Map yearsOfExperience if possible
    if (resume?.experience && Array.isArray(resume.experience)) {
      experienceSummary.yearsOfExperience = Math.max(0, Math.round(resume.experience.length * 0.3));
    }

    // 5. Project Highlights (Top 3 strongest projects)
    const projects: IProjectHighlight[] = (snapshot.projects || []).slice(0, 3).map((proj) => {
      const text = `${proj.title} ${proj.summary} ${proj.technologies.join(' ')}`.toLowerCase();
      let learning = 'Gained experience in system integration.';
      if (text.includes('api') || text.includes('server')) {
        learning = 'Mastered designing restful routing and data controllers.';
      } else if (text.includes('ai') || text.includes('llm') || text.includes('langgraph')) {
        learning = 'Learned orchestration patterns of autonomous agents.';
      } else if (text.includes('react') || text.includes('view') || text.includes('css')) {
        learning = 'Focused on responsive front-end elements and layout bindings.';
      }
      return {
        title: proj.title || 'Personal Project',
        description: proj.summary || 'Software application built by candidate.',
        technologies: proj.technologies || [],
        mostRelevantLearning: learning,
      };
    });

    // 6. Resume Strength Summary
    const strengthBullets: string[] = [];
    const lowerAllSkills = allSkills.map((s) => s.toLowerCase());

    if (
      lowerAllSkills.some(
        (s) =>
          s.includes('node') || s.includes('express') || s.includes('django') || s.includes('nest'),
      )
    ) {
      strengthBullets.push('Strong backend exposure');
    }
    if (
      lowerAllSkills.some((s) => s.includes('react') || s.includes('angular') || s.includes('next'))
    ) {
      strengthBullets.push('Built production full-stack applications');
    }
    if (
      lowerAllSkills.some(
        (s) =>
          s.includes('ai') ||
          s.includes('ml') ||
          s.includes('tensorflow') ||
          s.includes('pytorch') ||
          s.includes('llm'),
      )
    ) {
      strengthBullets.push('Experience with AI workflows');
    }
    if (
      lowerAllSkills.some((s) => s.includes('firebase') || s.includes('auth') || s.includes('jwt'))
    ) {
      strengthBullets.push('Firebase authentication and secure sessions');
    }
    if (
      lowerAllSkills.some((s) => s.includes('api') || s.includes('rest') || s.includes('graphql'))
    ) {
      strengthBullets.push('REST API development');
    }
    if (lowerAllSkills.some((s) => s.includes('sql') || s.includes('mongo') || s.includes('db'))) {
      strengthBullets.push('Database design and schema optimization');
    }
    if (strengthBullets.length === 0) {
      strengthBullets.push('Hands-on software application construction');
    }
    const resumeStrength = { bulletPoints: strengthBullets };

    // 7. Opportunity Summary
    const opportunitySummary = {
      title: opp.title || 'Software Engineering Opportunity',
      organization: opp.organization || opp.company || 'Hiring Organization',
      opportunityType: opp.opportunityType || 'INTERNSHIP',
      domain: opp.domain || 'Software Development',
      location: opp.location || 'India',
      workMode: mapWorkMode(opp),
      deadline: opp.deadline ? new Date(opp.deadline).toLocaleDateString() : undefined,
      requiredSkills: opp.skills || opp.requiredSkills || [],
      preferredSkills: opp.preferredSkills || [],
      educationRequirements:
        opp.educationRequirements || "Bachelor's Degree in CSE or allied branch",
      benefits: opp.benefits || [],
      descriptionSummary: opp.summary || opp.description || 'No description summary provided.',
      tags: opp.tags || [],
      qualityScore: opp.qualityScore || 85,
      trustLevel: opp.trustLevel || 'Verified',
    };

    // 8. Deterministic Match Analysis
    const oppSkillsLower = (opp.skills || opp.requiredSkills || []).map((s: string) =>
      s.toLowerCase(),
    );
    const topMatchingSkills = rankedOpp.matchedSkills || [];
    const missingSkills = (opp.skills || opp.requiredSkills || []).filter(
      (skill: string) =>
        !allSkills.some(
          (cSkill) =>
            cSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(cSkill.toLowerCase()),
        ),
    );

    const matchingInterests = (profile.interestDomains || []).filter(
      (domain) =>
        (opp.domain && opp.domain.toLowerCase().includes(domain.toLowerCase())) ||
        (opp.title && opp.title.toLowerCase().includes(domain.toLowerCase())),
    );

    const matchingPreferences = [];
    if (opp.remote && profile.remotePreference) {
      matchingPreferences.push('Remote preference matches');
    }
    if (opp.isStartup && profile.startupPreference) {
      matchingPreferences.push('Startup setting matches');
    }

    const potentialGaps = [];
    if (missingSkills.length > 2) {
      potentialGaps.push('Technical stack mismatch');
    }
    if (opp.location && profile.preferredLocations && profile.preferredLocations.length > 0) {
      const locationMatch = profile.preferredLocations.some((loc) =>
        opp.location.toLowerCase().includes(loc.toLowerCase()),
      );
      if (!locationMatch && !opp.remote) {
        potentialGaps.push('Location preference discrepancy');
      }
    }

    const relevantResumeProjects = rankedOpp.matchedProjects || [];
    const relevantExperience = (resume?.experience || [])
      .filter((exp: any) => {
        const text =
          `${exp.role || ''} ${exp.company || ''} ${exp.description || ''}`.toLowerCase();
        return oppSkillsLower.some((skill: string) => text.includes(skill));
      })
      .map((exp: any) => `${exp.role || 'Member'} at ${exp.company || 'Organization'}`);

    const matchAnalysis = {
      overallMatch: rankedOpp.totalScore,
      scoreBreakdown,
      topMatchingSkills,
      missingSkills,
      matchingInterests,
      matchingPreferences,
      potentialGaps,
      relevantResumeProjects,
      relevantExperience,
    };

    // 9. Recommendation Insights
    const insights = determineInsights(rankedOpp.totalScore, scoreBreakdown, opp, snapshot);

    // 10. Human-readable Summary
    const humanReadableSummary = generateHumanReadableSummary(
      userProfile,
      careerGoals,
      technicalProfile,
      opportunitySummary,
      matchAnalysis,
      insights,
    );

    return {
      userProfile,
      careerGoals,
      technicalProfile,
      experienceSummary,
      projects,
      resumeStrength,
      opportunity: opportunitySummary,
      matchAnalysis,
      insights,
      humanReadableSummary,
    };
  }
}

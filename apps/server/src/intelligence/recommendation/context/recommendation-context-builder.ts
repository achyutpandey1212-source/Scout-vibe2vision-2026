import { IProfile } from '../../../profile/models/profile.model';
import { CandidateSnapshot } from '../../../recommendation/engine/candidate-snapshot';
import {
  IRecommendationContext,
  ICandidateBrief,
  IOpportunityBrief,
  IMatchIntelligence,
  IPortfolioSummary,
  ISlotOpportunityContext,
  IUserProfileSummary,
  ICareerGoals,
  ITechnicalProfile,
  IExperienceSummary,
  IProjectHighlight,
  IResumeStrengthSummary,
  IOpportunitySummary,
  IDeterministicMatchAnalysis,
  IRecommendationInsights,
} from './context.types';
import {
  groupSkillsByCategory,
  categorizeExperience,
  mapWorkMode,
  determineInsights,
  generateHumanReadableSummary,
  generateDeterministicStrengths,
  generateDeterministicGrowthAreas,
} from './context.helpers';

export class RecommendationContextBuilder {
  /**
   * Curates a rich, structured RecommendationContext optimized for LLM consumption.
   * Accepts either top candidates array or single candidate for backward compatibility.
   */
  public build(
    profile: IProfile,
    resume: any,
    topCandidatesInput: any,
    snapshot: CandidateSnapshot,
  ): IRecommendationContext {
    const topCandidates = Array.isArray(topCandidatesInput)
      ? topCandidatesInput
      : [topCandidatesInput];

    const slotNames = ['perfectMatch', 'hiddenGem', 'quickWin', 'confidenceBuilder', 'stretchGoal'];

    // 1. Gather all skills across profile, snapshot, resume
    const allSkills = Array.from(
      new Set([
        ...(profile.technicalSkills || []),
        ...(profile.tools || []),
        ...(snapshot.technicalSkills || []),
        ...(snapshot.technologies || []),
        ...(resume?.skills || []),
      ]),
    );

    const technicalProfileGrouped = groupSkillsByCategory(allSkills);
    const experienceSummaryGrouped = categorizeExperience(
      resume?.experience || snapshot.experience || [],
    );

    // 2. Build CandidateBrief
    const candidateBrief: ICandidateBrief = {
      identity: {
        name: profile.fullName || (profile as any).name || 'Candidate',
        currentCareerStage: profile.currentYear
          ? `${profile.currentYear}th Year Student`
          : 'Entry Level',
        educationLevel: profile.degree || 'Undergraduate',
        degree: profile.degree || 'Bachelor of Technology',
        branch: profile.branch || 'Computer Science',
        college: profile.college || profile.university || 'University',
        graduationYear: profile.expectedGraduation,
        location:
          `${profile.city || ''}, ${profile.state || ''}`.trim().replace(/^,|,$/, '') || 'India',
        currentStatus: profile.persona || 'COLLEGE_STUDENT',
      },
      careerGoals: {
        preferredRoles: profile.preferredRoles || ['Software Engineer'],
        interestedDomains: profile.interestDomains || ['Software Development'],
        longTermGoals: profile.careerGoals || [],
        preferredIndustries: [],
        internshipVsFullTimePreference: profile.opportunityPreferences?.internships
          ? 'Internship'
          : 'Full-time',
        opportunityPreferences: Object.entries(profile.opportunityPreferences || {})
          .filter(([_, val]) => val === true)
          .map(([key]) => key),
      },
      technicalProfile: {
        strongestTechnologies:
          snapshot.strongestTechnologies.length > 0
            ? snapshot.strongestTechnologies
            : technicalProfileGrouped.languages
                .concat(technicalProfileGrouped.frameworks)
                .slice(0, 5),
        secondaryTechnologies: technicalProfileGrouped.other || [],
        languages: technicalProfileGrouped.languages,
        frameworks: technicalProfileGrouped.frameworks,
        backend: technicalProfileGrouped.backend,
        frontend: technicalProfileGrouped.frontend,
        databases: technicalProfileGrouped.databases,
        cloud: technicalProfileGrouped.cloud,
        aiMl: technicalProfileGrouped.aiMl,
        tools: technicalProfileGrouped.tools,
      },
      experienceSummary: {
        internshipCount: experienceSummaryGrouped.internships.length,
        projectCount: (snapshot.projects || []).length,
        leadershipCount: experienceSummaryGrouped.leadership.length,
        hackathonCount: experienceSummaryGrouped.hackathons.length,
        openSourceCount: experienceSummaryGrouped.openSource.length,
        certificationsCount: 0,
        internships: experienceSummaryGrouped.internships,
        leadership: experienceSummaryGrouped.leadership,
        majorAchievements: experienceSummaryGrouped.majorAchievements,
      },
      projectHighlights: (snapshot.projects || []).slice(0, 3).map((proj) => ({
        title: proj.title || 'Software Project',
        evidence: `${proj.title}: ${proj.summary || (proj as any).description || 'Demonstrated software development experience'} using ${(proj.technologies || []).join(', ')}`,
        technologies: proj.technologies || [],
      })),
      strengths: generateDeterministicStrengths(allSkills, snapshot),
      growthAreas: generateDeterministicGrowthAreas(allSkills),
      preferences: {
        remotePreference: Boolean(profile.remotePreference),
        workModePreferences: profile.remotePreference ? ['Remote'] : ['Onsite', 'Hybrid'],
        relocation: profile.preferredLocations?.length ? 'Flexible' : 'No relocation required',
        internshipVsFullTime: profile.opportunityPreferences?.internships
          ? 'Internship'
          : 'Full-time',
      },
    };

    // 3. Build OpportunityContexts (OpportunityBrief + MatchIntelligence) for each candidate
    const opportunityContexts: ISlotOpportunityContext[] = topCandidates
      .slice(0, 5)
      .map((cand, idx) => {
        const slot = slotNames[idx] || `match_${idx}`;
        const opp = cand.opportunity || cand;
        const score = cand.totalScore ?? cand.score ?? 75;
        const scoreBreakdown = cand.scoreBreakdown || {
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

        const difficulty: 'Easy' | 'Medium' | 'Stretch' =
          score >= 85 ? 'Easy' : score >= 70 ? 'Medium' : 'Stretch';

        const opportunityBrief: IOpportunityBrief = {
          role: opp.title || 'Software Engineering Opportunity',
          company: opp.organization || opp.company || 'Hiring Organization',
          title: opp.title || 'Software Engineering Opportunity',
          organization: opp.organization || opp.company || 'Hiring Organization',
          opportunityType: opp.opportunityType || 'INTERNSHIP',
          difficulty,
          location: opp.location || 'India',
          workMode: mapWorkMode(opp),
          deadline: opp.deadline ? new Date(opp.deadline).toLocaleDateString() : undefined,
          compensation: opp.stipend || opp.salary || opp.compensation || undefined,
          requiredSkills: opp.skills || opp.requiredSkills || [],
          preferredSkills: opp.preferredSkills || [],
          topTechnologies: (opp.skills || opp.requiredSkills || []).slice(0, 4),
          experienceLevel: opp.experienceLevel || 'Entry Level / Intern',
          learningOpportunities: `Exposure to ${opp.domain || 'software engineering'} workflows with ${(opp.skills || []).slice(0, 2).join(' / ')}`,
          mentorship: `Engineering guidance at ${opp.organization || opp.company || 'the team'}`,
          growthPotential: scoreBreakdown.careerGoal > 15 ? 'High' : 'Medium',
          uniqueBenefits: opp.benefits || ['Production engineering exposure', 'Mentorship'],
          whyInteresting: `${opp.organization || opp.company || 'Company'} is hiring a ${opp.title} working on ${opp.domain || 'software products'}.`,
        };

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

        const relevantResumeProjects = cand.matchedProjects || [];
        const relevantExperience = (resume?.experience || [])
          .filter((exp: any) => {
            const text =
              `${exp.role || ''} ${exp.company || ''} ${exp.description || ''}`.toLowerCase();
            return (opp.skills || []).some((skill: string) => text.includes(skill.toLowerCase()));
          })
          .map((exp: any) => `${exp.role || 'Member'} at ${exp.company || 'Organization'}`);

        const insights = determineInsights(score, scoreBreakdown, opp, snapshot);

        const matchIntelligence: IMatchIntelligence = {
          overallMatchScore: score,
          confidenceScore: insights.confidenceScore,
          topMatchingSkills: cand.matchedSkills || [],
          missingSkills,
          matchingInterests,
          matchingPreferences,
          relevantProjects: relevantResumeProjects,
          relevantExperience,
          skillGaps: missingSkills,
          reasonCandidateRankedHighly:
            (cand.reasons && cand.reasons[0]) ||
            `Strong technical skill alignment (${cand.matchedSkills?.join(', ') || 'skills'})`,
          estimatedCompetitiveness: insights.estimatedCompetitiveness,
          urgency: insights.applicationUrgency,
          learningPotential: insights.learningPotential,
          careerGrowthPotential: insights.growthPotential,
          resumeFit: insights.resumeFit,
        };

        return {
          slot,
          opportunityBrief,
          matchIntelligence,
        };
      });

    // 4. Build PortfolioSummary
    const roles = Array.from(
      new Set(topCandidates.map((c) => (c.opportunity || c).title || 'Software Engineer')),
    );
    const techs = Array.from(
      new Set(
        topCandidates.flatMap(
          (c) => (c.opportunity || c).skills || (c.opportunity || c).requiredSkills || [],
        ),
      ),
    );
    const companies = Array.from(
      new Set(
        topCandidates.map(
          (c) => (c.opportunity || c).organization || (c.opportunity || c).company || 'Company',
        ),
      ),
    );

    let easy = 0,
      medium = 0,
      stretch = 0;
    topCandidates.forEach((c) => {
      const s = c.totalScore ?? c.score ?? 75;
      if (s >= 85) easy++;
      else if (s >= 70) medium++;
      else stretch++;
    });

    const portfolioSummary: IPortfolioSummary = {
      todayCoveredRoles: roles,
      technologiesCovered: techs.slice(0, 10),
      difficultySpread: { easy, medium, stretch },
      companiesCount: companies.length,
      uniqueRoleFamiliesCount: roles.length,
    };

    // 5. Build legacy helper properties for full backward compatibility
    const sampleCand = topCandidates[0] || {};
    const sampleOpp = sampleCand.opportunity || sampleCand;
    const userProfileLegacy: IUserProfileSummary = {
      name: profile.fullName || (profile as any).name || 'Candidate',
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

    const careerGoalsLegacy: ICareerGoals = {
      preferredRoles: profile.preferredRoles || [],
      interestedDomains: profile.interestDomains || [],
      longTermGoals: profile.careerGoals || [],
      preferredIndustries: [],
      opportunityPreferences: Object.entries(profile.opportunityPreferences || {})
        .filter(([_, val]) => val === true)
        .map(([key]) => key),
      workModePreferences: profile.remotePreference ? ['Remote'] : ['Onsite', 'Hybrid'],
      internshipVsFullTimePreference: profile.opportunityPreferences?.internships
        ? 'Internship'
        : 'Full-time',
    };

    const projectsLegacy: IProjectHighlight[] = (snapshot.projects || [])
      .slice(0, 3)
      .map((proj) => ({
        title: proj.title || 'Personal Project',
        description: proj.summary || 'Software application built by candidate.',
        technologies: proj.technologies || [],
        mostRelevantLearning: 'Gained experience in system integration.',
      }));

    const resumeStrengthLegacy: IResumeStrengthSummary = {
      bulletPoints: candidateBrief.strengths,
    };

    const opportunityLegacy: IOpportunitySummary = {
      title: sampleOpp.title || 'Software Engineering Opportunity',
      organization: sampleOpp.organization || sampleOpp.company || 'Hiring Organization',
      opportunityType: sampleOpp.opportunityType || 'INTERNSHIP',
      domain: sampleOpp.domain || 'Software Development',
      location: sampleOpp.location || 'India',
      workMode: mapWorkMode(sampleOpp),
      deadline: sampleOpp.deadline ? new Date(sampleOpp.deadline).toLocaleDateString() : undefined,
      requiredSkills: sampleOpp.skills || sampleOpp.requiredSkills || [],
      preferredSkills: sampleOpp.preferredSkills || [],
      educationRequirements: "Bachelor's Degree in CSE or allied branch",
      benefits: sampleOpp.benefits || [],
      descriptionSummary:
        sampleOpp.summary || sampleOpp.description || 'No description summary provided.',
      tags: sampleOpp.tags || [],
      qualityScore: sampleOpp.qualityScore || 85,
      trustLevel: sampleOpp.trustLevel || 'Verified',
    };

    const matchAnalysisLegacy: IDeterministicMatchAnalysis = {
      overallMatch: sampleCand.totalScore || 75,
      scoreBreakdown: sampleCand.scoreBreakdown || {
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
      },
      topMatchingSkills: sampleCand.matchedSkills || [],
      missingSkills: opportunityContexts[0]?.matchIntelligence.missingSkills || [],
      matchingInterests: opportunityContexts[0]?.matchIntelligence.matchingInterests || [],
      matchingPreferences: opportunityContexts[0]?.matchIntelligence.matchingPreferences || [],
      potentialGaps: opportunityContexts[0]?.matchIntelligence.skillGaps || [],
      relevantResumeProjects: sampleCand.matchedProjects || [],
      relevantExperience: opportunityContexts[0]?.matchIntelligence.relevantExperience || [],
    };

    const insightsLegacy = determineInsights(
      sampleCand.totalScore || 75,
      sampleCand.scoreBreakdown || {},
      sampleOpp,
      snapshot,
    );

    const humanReadableSummaryLegacy = generateHumanReadableSummary(
      userProfileLegacy,
      careerGoalsLegacy,
      technicalProfileGrouped,
      opportunityLegacy,
      matchAnalysisLegacy,
      insightsLegacy,
    );

    return {
      candidateBrief,
      portfolioSummary,
      opportunityContexts,
      userProfile: userProfileLegacy,
      careerGoals: careerGoalsLegacy,
      technicalProfile: technicalProfileGrouped,
      experienceSummary: experienceSummaryGrouped,
      projects: projectsLegacy,
      resumeStrength: resumeStrengthLegacy,
      opportunity: opportunityLegacy,
      matchAnalysis: matchAnalysisLegacy,
      insights: insightsLegacy,
      humanReadableSummary: humanReadableSummaryLegacy,
    };
  }
}

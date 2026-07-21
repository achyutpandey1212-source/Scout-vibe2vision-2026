import { CandidateSnapshot } from './candidate-snapshot';

export interface PortfolioSlot {
  slotName: 'perfectMatch' | 'hiddenGem' | 'fastApply' | 'resumeBuilder' | 'stretchGoal';
  candidate: any; // Ranked candidate from Stage 2
  reason: string;
}

export interface RecommendationPortfolio {
  slots: Record<string, PortfolioSlot>;
  selectedCandidates: any[];
  uniqueCompaniesCount: number;
  uniqueRoleFamiliesCount: number;
  uniqueTechnologiesCount: number;
  portfolioDiversityScore: number;
  diversityBreakdown: {
    roleDiversity: number;
    companyDiversity: number;
    typeDiversity: number;
    techDiversity: number;
    difficultyProgression: number;
  };
}

export class RecommendationPortfolioBuilder {
  /**
   * Infer role family deterministically from opportunity title and description.
   */
  public static inferRoleFamily(opp: any): string {
    const text =
      `${opp.title || ''} ${opp.summary || ''} ${opp.description || ''} ${(opp.skills || []).join(' ')}`.toLowerCase();

    if (text.includes('full stack') || text.includes('fullstack') || text.includes('mern'))
      return 'Full Stack';
    if (
      text.includes('ai') ||
      text.includes('machine learning') ||
      text.includes('llm') ||
      text.includes('deep learning') ||
      text.includes('langgraph') ||
      text.includes('gemini')
    )
      return 'AI / ML';
    if (
      text.includes('cloud') ||
      text.includes('devops') ||
      text.includes('aws') ||
      text.includes('docker') ||
      text.includes('kubernetes') ||
      text.includes('infrastructure')
    )
      return 'Cloud / DevOps';
    if (
      text.includes('backend') ||
      text.includes('server') ||
      text.includes('express') ||
      text.includes('node') ||
      text.includes('api') ||
      text.includes('microservice')
    )
      return 'Backend';
    if (
      text.includes('frontend') ||
      text.includes('react') ||
      text.includes('ui') ||
      text.includes('ux') ||
      text.includes('web') ||
      text.includes('vue')
    )
      return 'Frontend';
    if (
      text.includes('data') ||
      text.includes('analytics') ||
      text.includes('sql') ||
      text.includes('pipeline')
    )
      return 'Data';
    if (
      text.includes('mobile') ||
      text.includes('android') ||
      text.includes('ios') ||
      text.includes('flutter')
    )
      return 'Mobile';
    if (text.includes('security') || text.includes('cyber')) return 'Security';
    if (text.includes('hackathon') || opp.opportunityType === 'HACKATHON') return 'Hackathon';
    if (
      text.includes('fellowship') ||
      text.includes('scholarship') ||
      opp.opportunityType === 'FELLOWSHIP'
    )
      return 'Fellowship';

    return 'General Software';
  }

  /**
   * Deterministically curates a 5-slot recommendation portfolio.
   */
  public buildPortfolio(rankedList: any[], snapshot: CandidateSnapshot): RecommendationPortfolio {
    if (!rankedList || rankedList.length === 0) {
      throw new Error('Cannot build portfolio from empty candidate list.');
    }

    const available = [...rankedList];
    const selectedIds = new Set<string>();
    const selectedCompanies = new Set<string>();
    const selectedRoleFamilies = new Set<string>();
    const selectedTypes = new Set<string>();
    const selectedTechs = new Set<string>();

    const slots: Record<string, PortfolioSlot> = {};

    // Helper to extract clean ID/URL/Company
    const getOpp = (c: any) => c.opportunity || c;
    const getId = (c: any) => getOpp(c).id || getOpp(c)._id?.toString() || getOpp(c).title;
    const getCompany = (c: any) =>
      (getOpp(c).organization || getOpp(c).company || 'Unknown').toLowerCase();

    // Helper selection fallback
    const pickBestMatch = (predicate: (cand: any) => boolean, defaultReason: string): any => {
      // 1. Try candidates matching predicate and unique company
      let match = available.find(
        (c) => !selectedIds.has(getId(c)) && predicate(c) && !selectedCompanies.has(getCompany(c)),
      );

      // 2. Try candidates matching predicate even if company repeated
      if (!match) {
        match = available.find((c) => !selectedIds.has(getId(c)) && predicate(c));
      }

      // 3. Fallback: try candidate with unique company
      if (!match) {
        match = available.find(
          (c) => !selectedIds.has(getId(c)) && !selectedCompanies.has(getCompany(c)),
        );
      }

      // 4. Ultimate fallback: pick next highest scoring candidate
      if (!match) {
        match = available.find((c) => !selectedIds.has(getId(c)));
      }

      if (match) {
        const id = getId(match);
        const comp = getCompany(match);
        const opp = getOpp(match);
        const family = RecommendationPortfolioBuilder.inferRoleFamily(opp);

        selectedIds.add(id);
        selectedCompanies.add(comp);
        selectedRoleFamilies.add(family);
        selectedTypes.add(opp.opportunityType || 'INTERNSHIP');

        (opp.skills || []).forEach((s: string) => selectedTechs.add(s.toLowerCase()));
      }

      return match;
    };

    // 1. Perfect Match Strategy: Highest overall score
    const perfectMatchCand = pickBestMatch(() => true, 'Highest deterministic match score');
    if (perfectMatchCand) {
      slots['perfectMatch'] = {
        slotName: 'perfectMatch',
        candidate: perfectMatchCand,
        reason: 'Highest overall fit and project alignment.',
      };
    }

    // 2. Hidden Gem Strategy: High hidden opportunity score / startup / underrated
    const hiddenGemCand = pickBestMatch((c) => {
      const opp = getOpp(c);
      const isStartup =
        (opp.organization || '').toLowerCase().includes('labs') ||
        (opp.organization || '').toLowerCase().includes('ai') ||
        (opp.description || '').toLowerCase().includes('seed') ||
        (opp.description || '').toLowerCase().includes('startup');
      const score = c.totalScore || c.score || 0;
      return isStartup || score >= 60;
    }, 'High potential underrated opportunity');

    if (hiddenGemCand) {
      slots['hiddenGem'] = {
        slotName: 'hiddenGem',
        candidate: hiddenGemCand,
        reason: 'Underrated opportunity with high growth potential.',
      };
    }

    // 3. Fast Apply Strategy: Direct application URL, rolling deadline, internship
    const fastApplyCand = pickBestMatch((c) => {
      const opp = getOpp(c);
      return Boolean(opp.applyUrl || opp.link) || opp.opportunityType === 'INTERNSHIP';
    }, 'Direct application URL with minimal barrier');

    if (fastApplyCand) {
      slots['fastApply'] = {
        slotName: 'fastApply',
        candidate: fastApplyCand,
        reason: 'Direct apply option available today with low application friction.',
      };
    }

    // 4. Resume Builder Strategy: Fills candidate skill gaps (e.g. AWS, Docker, Kubernetes, CI/CD, System Design)
    const candTechSet = new Set(snapshot.technologies);
    const resumeBuilderCand = pickBestMatch((c) => {
      const opp = getOpp(c);
      const oppSkills = (opp.skills || []).map((s: string) => s.toLowerCase());
      const hasSkillGap = oppSkills.some((s: string) => !candTechSet.has(s));
      return hasSkillGap;
    }, 'Expands candidate skill profile with new technologies');

    if (resumeBuilderCand) {
      slots['resumeBuilder'] = {
        slotName: 'resumeBuilder',
        candidate: resumeBuilderCand,
        reason: 'Fills key technical skill gaps to strengthen your resume.',
      };
    }

    // 5. Stretch Goal Strategy: High difficulty / selectivity / ambitious match gap
    const stretchGoalCand = pickBestMatch((c) => {
      const opp = getOpp(c);
      const isAmbitious =
        (opp.title || '').toLowerCase().includes('fellow') ||
        (opp.title || '').toLowerCase().includes('scholar') ||
        (opp.title || '').toLowerCase().includes('lead') ||
        (c.totalScore || c.score || 0) >= 70;
      return isAmbitious;
    }, 'Ambitious high-impact target');

    if (stretchGoalCand) {
      slots['stretchGoal'] = {
        slotName: 'stretchGoal',
        candidate: stretchGoalCand,
        reason: 'Ambitious target that challenges your current technical profile.',
      };
    }

    // List of selected candidates preserving slot order
    const selectedCandidates = [
      slots['perfectMatch']?.candidate,
      slots['hiddenGem']?.candidate,
      slots['fastApply']?.candidate,
      slots['resumeBuilder']?.candidate,
      slots['stretchGoal']?.candidate,
    ].filter(Boolean);

    // Compute 5-Factor Portfolio Diversity Score
    const totalSlots = selectedCandidates.length || 1;
    const roleDiversity = Math.min(35, Math.round((selectedRoleFamilies.size / totalSlots) * 35));
    const companyDiversity = Math.min(25, Math.round((selectedCompanies.size / totalSlots) * 25));
    const typeDiversity = Math.min(
      20,
      Math.round((selectedTypes.size / Math.min(3, totalSlots)) * 20),
    );
    const techDiversity = Math.min(10, Math.round((selectedTechs.size / 10) * 10));
    const difficultyProgression = 10;

    const portfolioDiversityScore = Math.min(
      100,
      roleDiversity + companyDiversity + typeDiversity + techDiversity + difficultyProgression,
    );

    return {
      slots,
      selectedCandidates,
      uniqueCompaniesCount: selectedCompanies.size,
      uniqueRoleFamiliesCount: selectedRoleFamilies.size,
      uniqueTechnologiesCount: selectedTechs.size,
      portfolioDiversityScore,
      diversityBreakdown: {
        roleDiversity,
        companyDiversity,
        typeDiversity,
        techDiversity,
        difficultyProgression,
      },
    };
  }
}

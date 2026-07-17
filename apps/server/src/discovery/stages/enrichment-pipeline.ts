export class OpportunityEnrichmentPipeline {
  /**
   * Run the full multi-stage enrichment pipeline on an opportunity.
   */
  public enrich(opp: any, sourceRegistryEntry: any): void {
    this.stage1Normalization(opp);
    this.stage2SkillIntelligence(opp);
    this.stage3StudentFitIntelligence(opp);
    this.stage4CareerValueIntelligence(opp, sourceRegistryEntry);
    this.stage5QualityAndHiddenGem(opp, sourceRegistryEntry);
    this.stage6GoldReasons(opp);
    this.stage7ReadinessAssessment(opp);
  }

  private stage1Normalization(opp: any): void {
    const titleLower = opp.title.toLowerCase();
    const descLower = opp.description.toLowerCase();

    // Commitment
    if (
      descLower.includes('part-time') ||
      descLower.includes('part time') ||
      titleLower.includes('part-time')
    ) {
      opp.commitment = 'PART_TIME';
    } else if (
      descLower.includes('full-time') ||
      descLower.includes('full time') ||
      titleLower.includes('full-time')
    ) {
      opp.commitment = 'FULL_TIME';
    } else {
      opp.commitment = 'FLEXIBLE';
    }

    // Work Mode
    if (opp.workMode) {
      opp.workMode = opp.workMode.toUpperCase();
    } else {
      if (descLower.includes('remote') || titleLower.includes('remote') || opp.remote) {
        opp.workMode = 'REMOTE';
      } else if (descLower.includes('hybrid') || titleLower.includes('hybrid')) {
        opp.workMode = 'HYBRID';
      } else {
        opp.workMode = 'ONSITE';
      }
    }
  }

  private stage2SkillIntelligence(opp: any): void {
    const extractedSkills = opp.skills || [];
    const technicalList: string[] = [];
    const softList: string[] = [];
    const toolsList: string[] = [];

    const softKeywords = [
      'communication',
      'leadership',
      'problem solving',
      'collaboration',
      'writing',
      'teamwork',
      'analytical',
      'interpersonal',
      'creativity',
    ];
    const toolsKeywords = [
      'git',
      'github',
      'vscode',
      'docker',
      'kubernetes',
      'jenkins',
      'jira',
      'figma',
      'postman',
      'aws',
      'gcp',
      'azure',
    ];

    extractedSkills.forEach((skill: string) => {
      const cleanSkill = skill.trim().toLowerCase();
      let normalized = cleanSkill;
      if (cleanSkill === 'react' || cleanSkill === 'reactjs') normalized = 'react';
      if (cleanSkill === 'node' || cleanSkill === 'nodejs' || cleanSkill === 'node.js')
        normalized = 'nodejs';
      if (cleanSkill === 'js' || cleanSkill === 'javascript') normalized = 'javascript';
      if (cleanSkill === 'py' || cleanSkill === 'python') normalized = 'python';

      if (softKeywords.some((kw) => cleanSkill.includes(kw))) {
        softList.push(normalized);
      } else if (toolsKeywords.some((kw) => cleanSkill.includes(kw))) {
        toolsList.push(normalized);
      } else {
        technicalList.push(normalized);
      }
    });

    opp.skillsTechnical = Array.from(new Set(technicalList));
    opp.skillsSoft = Array.from(new Set(softList));
    opp.skillsTools = Array.from(new Set(toolsList));
    opp.skills = Array.from(new Set([...technicalList, ...softList, ...toolsList]));

    // Domain Classification
    const titleLower = opp.title.toLowerCase();
    const descLower = opp.description.toLowerCase();
    const domains: string[] = [];
    if (
      titleLower.includes('ai') ||
      titleLower.includes('ml') ||
      titleLower.includes('machine learning') ||
      titleLower.includes('deep learning') ||
      descLower.includes('artificial intelligence') ||
      descLower.includes('nlp')
    ) {
      domains.push('AI', 'Machine Learning');
    }
    if (
      titleLower.includes('front') ||
      titleLower.includes('react') ||
      titleLower.includes('web') ||
      titleLower.includes('html') ||
      descLower.includes('frontend') ||
      descLower.includes('react') ||
      opp.skills.includes('react')
    ) {
      domains.push('Frontend');
    }
    if (
      titleLower.includes('back') ||
      titleLower.includes('node') ||
      titleLower.includes('express') ||
      titleLower.includes('django') ||
      descLower.includes('backend') ||
      descLower.includes('node') ||
      opp.skills.includes('nodejs')
    ) {
      domains.push('Backend');
    }
    if (domains.includes('Frontend') && domains.includes('Backend')) {
      domains.push('Full Stack');
    }
    if (
      titleLower.includes('cloud') ||
      titleLower.includes('aws') ||
      titleLower.includes('azure') ||
      titleLower.includes('gcp')
    ) {
      domains.push('Cloud');
    }
    if (
      titleLower.includes('devops') ||
      titleLower.includes('ci/cd') ||
      titleLower.includes('sre') ||
      descLower.includes('infrastructure')
    ) {
      domains.push('DevOps');
    }
    if (
      titleLower.includes('cyber') ||
      titleLower.includes('security') ||
      descLower.includes('cryptography')
    ) {
      domains.push('Cybersecurity');
    }
    if (
      titleLower.includes('embed') ||
      titleLower.includes('hardware') ||
      titleLower.includes('microcontroller')
    ) {
      domains.push('Embedded', 'Electronics');
    }
    if (titleLower.includes('robot') || descLower.includes('robotics')) {
      domains.push('Robotics');
    }
    if (titleLower.includes('iot') || descLower.includes('internet of things')) {
      domains.push('IoT');
    }
    if (
      titleLower.includes('data') ||
      titleLower.includes('analytics') ||
      titleLower.includes('sql')
    ) {
      domains.push('Data Science');
    }
    if (
      titleLower.includes('mobile') ||
      titleLower.includes('android') ||
      titleLower.includes('ios') ||
      titleLower.includes('flutter')
    ) {
      domains.push('Mobile');
    }
    if (
      titleLower.includes('semiconductor') ||
      titleLower.includes('vlsi') ||
      titleLower.includes('fpga')
    ) {
      domains.push('Semiconductor');
    }
    if (domains.length === 0) {
      domains.push('Backend');
    }
    opp.domains = Array.from(new Set(domains));
  }

  private stage3StudentFitIntelligence(opp: any): void {
    const titleLower = opp.title.toLowerCase();
    const descLower = opp.description.toLowerCase();
    const eligLower = (opp.eligibility || '').toLowerCase();

    const hasDegreeRequirement =
      eligLower.includes('btech') ||
      eligLower.includes('b.tech') ||
      eligLower.includes('mtech') ||
      eligLower.includes('m.tech') ||
      eligLower.includes('degree') ||
      eligLower.includes('be') ||
      eligLower.includes('b.e');
    const hasSeniorTerm =
      titleLower.includes('senior') ||
      titleLower.includes('lead') ||
      titleLower.includes('principal') ||
      titleLower.includes('architect');

    opp.suitableFirstYear =
      !hasSeniorTerm && !hasDegreeRequirement && !descLower.includes('final year');
    opp.suitableSecondYear = !hasSeniorTerm && !eligLower.includes('final year only');
    opp.suitableThirdYear = !hasSeniorTerm;
    opp.suitableFourthYear = true;
    opp.suitableGraduate =
      !titleLower.includes('student only') && !descLower.includes('currently enrolled');

    if (hasSeniorTerm) {
      opp.suitabilityReason = 'Requires senior engineering industry experience.';
    } else if (opp.opportunityType === 'HACKATHON') {
      opp.suitabilityReason =
        'Excellent for all engineering student cohorts to build resumes and portfolios.';
    } else if (opp.suitableFirstYear) {
      opp.suitabilityReason = 'Highly beginner friendly with general eligibility requirements.';
    } else {
      opp.suitabilityReason =
        'Well-suited for 3rd and 4th-year students with basic technical foundational skills.';
    }

    if (!opp.experienceLevel) {
      opp.experienceLevel = opp.suitableFirstYear
        ? '1st Year'
        : opp.suitableSecondYear
          ? '2nd Year'
          : '3rd Year';
    }
  }

  private stage4CareerValueIntelligence(opp: any, sourceRegistryEntry: any): void {
    const sourceEco = sourceRegistryEntry?.ecosystemType || 'BIG_TECH';
    if (sourceEco === 'STARTUP') {
      opp.organizationType = 'STARTUP';
      opp.organizationStage = 'EARLY_STARTUP';
    } else if (sourceEco === 'VC_PORTFOLIO' || sourceEco === 'INCUBATOR') {
      opp.organizationType = 'STARTUP';
      opp.organizationStage = 'GROWTH_STARTUP';
    } else if (sourceEco === 'BIG_TECH') {
      opp.organizationType = 'MNC';
      opp.organizationStage = 'ENTERPRISE';
    } else if (sourceEco === 'GOVERNMENT') {
      opp.organizationType = 'GOVERNMENT';
      opp.organizationStage = 'GOVERNMENT';
    } else if (sourceEco === 'UNIVERSITY') {
      opp.organizationType = 'UNIVERSITY';
      opp.organizationStage = 'ACADEMIC';
    } else if (sourceEco === 'RESEARCH') {
      opp.organizationType = 'OTHER';
      opp.organizationStage = 'ACADEMIC';
    } else {
      opp.organizationType = 'OTHER';
      opp.organizationStage = null;
    }

    if (opp.organizationType === 'MNC' || (sourceRegistryEntry?.trustScore || 0) >= 95) {
      opp.competitionEstimate = 'VERY_HIGH';
    } else if (opp.organizationType === 'STARTUP') {
      opp.competitionEstimate = 'LOW';
    } else if (opp.organizationType === 'GOVERNMENT' || opp.organizationType === 'UNIVERSITY') {
      opp.competitionEstimate = 'HIGH';
    } else {
      opp.competitionEstimate = 'MEDIUM';
    }

    let resume = 50,
      learning = 50,
      networking = 50,
      exposure = 50,
      portfolio = 50,
      research = 10,
      interview = 50;

    if (opp.opportunityType === 'HACKATHON') {
      networking = 95;
      portfolio = 90;
      resume = 80;
      learning = 85;
      exposure = 80;
      interview = 70;
    } else if (opp.opportunityType === 'SCHOLARSHIP' || opp.opportunityType === 'FELLOWSHIP') {
      networking = 85;
      resume = 90;
      learning = 75;
      exposure = 80;
      portfolio = 60;
    } else if (opp.domains?.includes('AI') || opp.domains?.includes('Machine Learning')) {
      learning = 90;
      portfolio = 85;
      resume = 80;
    }

    if (opp.organizationType === 'STARTUP') {
      portfolio = Math.min(100, portfolio + 15);
      learning = Math.min(100, learning + 10);
      networking = Math.max(30, networking - 10);
    } else if (opp.organizationType === 'MNC') {
      resume = Math.min(100, resume + 20);
      exposure = Math.min(100, exposure + 15);
    } else if (opp.organizationType === 'GOVERNMENT' || opp.organizationType === 'UNIVERSITY') {
      research = Math.min(100, research + 70);
      resume = Math.min(100, resume + 15);
    }

    opp.careerValResume = resume;
    opp.careerValLearning = learning;
    opp.careerValNetworking = networking;
    opp.careerValExposure = exposure;
    opp.careerValPortfolio = portfolio;
    opp.careerValResearch = research;
    opp.careerValInterview = interview;
  }

  private stage5QualityAndHiddenGem(opp: any, sourceRegistryEntry: any): void {
    const descLower = opp.description.toLowerCase();
    const sourceEco = sourceRegistryEntry?.ecosystemType || 'BIG_TECH';

    // Quality Refinement
    let qScore = 50;
    const qBreakdown = {
      officialSource: opp.organizationType !== 'OTHER',
      deadlinePresent: !!opp.deadline,
      applicationLink: !!opp.applicationUrl,
      richDescription: opp.description.length > 300,
      benefitsPresent:
        descLower.includes('benefit') ||
        descLower.includes('perk') ||
        descLower.includes('stipend') ||
        descLower.includes('salary'),
      stipendPresent:
        !!opp.stipend ||
        !!opp.salary ||
        descLower.includes('stipend') ||
        descLower.includes('paid'),
    };

    if (qBreakdown.officialSource) qScore += 15;
    if (qBreakdown.deadlinePresent) qScore += 10;
    if (qBreakdown.applicationLink) qScore += 15;
    if (qBreakdown.richDescription) qScore += 15;
    if (qBreakdown.benefitsPresent) qScore += 10;
    if (qBreakdown.stipendPresent) qScore += 15;

    if (opp.description.length < 100) qScore -= 20;
    if (descLower.includes('senior') && opp.opportunityType === 'INTERNSHIP') qScore -= 15;

    opp.qualityScore = Math.max(0, Math.min(100, qScore));
    opp.qualityBreakdown = qBreakdown;

    // Hidden Gem Intelligence
    let hgScore = 50;
    if (opp.organizationType === 'STARTUP') hgScore += 25;
    if (opp.organizationType === 'UNIVERSITY' || sourceEco === 'RESEARCH') hgScore += 20;
    if (opp.organizationType === 'GOVERNMENT') hgScore += 15;
    if (opp.competitionEstimate === 'LOW') hgScore += 15;
    if (opp.competitionEstimate === 'VERY_HIGH') hgScore -= 25;

    opp.hiddenGemScore = Math.max(0, Math.min(100, hgScore));

    // Deadline Urgency Estimation
    if (!opp.deadline) {
      opp.deadlineStatus = 'ROLLING';
      opp.daysRemaining = null;
    } else {
      try {
        const today = new Date();
        const deadDate = new Date(opp.deadline);
        const diffTime = deadDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        opp.daysRemaining = diffDays;

        if (diffDays < 0) {
          opp.deadlineStatus = 'EXPIRED';
          opp.status = 'EXPIRED';
        } else if (diffDays <= 7) {
          opp.deadlineStatus = 'CLOSING_SOON';
        } else {
          opp.deadlineStatus = 'OPEN';
        }
      } catch {
        opp.deadlineStatus = 'UNKNOWN';
        opp.daysRemaining = null;
      }
    }
  }

  private stage6GoldReasons(opp: any): void {
    const goldReasons: string[] = [];
    const org = opp.organization;
    if (
      opp.organizationType === 'STARTUP' &&
      (opp.domains?.includes('AI') || opp.domains?.includes('Machine Learning'))
    ) {
      goldReasons.push(
        `Excellent opportunity to gain production AI/ML experience at early-stage startup ${org}.`,
      );
    } else if (opp.organizationType === 'STARTUP') {
      goldReasons.push(`Gain high-ownership technical experience at startup ${org}.`);
    } else if (opp.organizationType === 'MNC') {
      goldReasons.push(`Prestigious global technology brand experience at ${org}.`);
    } else if (opp.organizationType === 'GOVERNMENT') {
      goldReasons.push(`Highly valued public-sector student training pathway at ${org}.`);
    }

    if (opp.suitableSecondYear && !opp.suitableFirstYear) {
      goldReasons.push(`Strong fit for second and third-year student developers.`);
    } else if (opp.suitableFirstYear) {
      goldReasons.push(`Extremely beginner friendly, open to early-stage undergrad students.`);
    }

    if (opp.qualityBreakdown?.stipendPresent) {
      goldReasons.push(`Provides competitive financial compensation (stipend/salary).`);
    }

    opp.goldReasons = goldReasons.slice(0, 3);
  }

  private stage7ReadinessAssessment(opp: any): void {
    let completeness = 0;
    if (opp.title) completeness += 15;
    if (opp.description && opp.description.length > 100) completeness += 20;
    if (opp.applicationUrl) completeness += 20;
    if (opp.organization) completeness += 15;
    if (opp.opportunityType) completeness += 15;
    if (opp.skills && opp.skills.length > 0) completeness += 15;

    opp.readinessScore = completeness;
    if (completeness >= 80 && opp.deadlineStatus !== 'EXPIRED' && opp.qualityScore >= 50) {
      opp.readinessStatus = 'READY';
    } else {
      opp.readinessStatus = 'NEEDS_REVIEW';
    }
  }
}

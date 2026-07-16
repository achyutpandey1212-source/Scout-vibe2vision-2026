export interface ResumeLayoutProfile {
  projectLayout: 'NUMBERED' | 'HEADING' | 'GENERIC';
  experienceLayout: 'ROLE_FIRST' | 'COMPANY_FIRST' | 'GENERIC';
  educationLayout: 'ATS' | 'GENERIC';
  skillsLayout: 'BULLET' | 'GENERIC';
}

export class LayoutDetector {
  static detect(
    rawText: string,
    sections: {
      educationText: string;
      projectsText: string;
      experienceText: string;
      skillsText: string;
    },
  ): ResumeLayoutProfile {
    // 1. Project layout detection
    let projectLayout: ResumeLayoutProfile['projectLayout'] = 'GENERIC';
    const projectLines = sections.projectsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    let numberedCount = 0;
    let headingSymbolCount = 0;

    for (const line of projectLines) {
      if (/^\s*\d+[.)]\s+/.test(line)) {
        numberedCount++;
      }
      if (/^\s*[■●▪•\-*]\s+/.test(line)) {
        headingSymbolCount++;
      }
    }

    if (
      numberedCount >= 2 ||
      (projectLines.length > 0 && numberedCount >= 1 && projectLines.length <= 15)
    ) {
      projectLayout = 'NUMBERED';
    } else if (headingSymbolCount >= 2) {
      projectLayout = 'HEADING';
    }

    // 2. Experience layout detection
    let experienceLayout: ResumeLayoutProfile['experienceLayout'] = 'GENERIC';
    const expLines = sections.experienceText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    let roleFirstCount = 0;
    let companyFirstCount = 0;
    const roleKeywords = [
      'ambassador',
      'lead',
      'chair',
      'volunteer',
      'mentor',
      'coordinator',
      'organizer',
      'intern',
      'developer',
      'engineer',
      'manager',
      'specialist',
      'consultant',
      'officer',
      'executive',
    ];
    const companyKeywords = [
      'google',
      'hackhazard',
      'microsoft',
      'gdsc',
      'ieee',
      'techcorp',
      'acm',
      'github',
      'corporation',
      'inc',
      'pvt',
      'ltd',
      'university',
      'college',
      'institute',
      'solutions',
      'technologies',
    ];

    for (const line of expLines) {
      const lower = line.toLowerCase();
      const hasRole = roleKeywords.some((w) => lower.includes(w));
      const hasCompany = companyKeywords.some((w) => lower.includes(w));

      if (hasRole && hasCompany) {
        const foundRoles = roleKeywords.map((w) => lower.indexOf(w)).filter((idx) => idx !== -1);
        const foundCompanies = companyKeywords
          .map((w) => lower.indexOf(w))
          .filter((idx) => idx !== -1);
        const roleIdx = Math.min(...foundRoles);
        const companyIdx = Math.min(...foundCompanies);

        if (companyIdx < roleIdx) {
          companyFirstCount++;
        } else {
          roleFirstCount++;
        }
      }
    }

    if (companyFirstCount > roleFirstCount) {
      experienceLayout = 'COMPANY_FIRST';
    } else if (roleFirstCount > 0) {
      experienceLayout = 'ROLE_FIRST';
    }

    // 3. Education layout detection
    let educationLayout: ResumeLayoutProfile['educationLayout'] = 'GENERIC';
    const eduTextLower = sections.educationText.toLowerCase();
    if (
      eduTextLower.includes('cgpa') ||
      eduTextLower.includes('gpa') ||
      eduTextLower.includes('percentage') ||
      eduTextLower.includes('marks')
    ) {
      educationLayout = 'ATS';
    }

    // 4. Skills layout detection
    let skillsLayout: ResumeLayoutProfile['skillsLayout'] = 'GENERIC';
    if (
      sections.skillsText.includes('•') ||
      sections.skillsText.includes('|') ||
      sections.skillsText.includes(',')
    ) {
      skillsLayout = 'BULLET';
    }

    return {
      projectLayout,
      experienceLayout,
      educationLayout,
      skillsLayout,
    };
  }
}

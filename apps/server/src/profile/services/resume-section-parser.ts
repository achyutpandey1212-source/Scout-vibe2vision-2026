import {
  EDUCATION_HEADERS,
  PROJECT_HEADERS,
  SKILLS_HEADERS,
  EXPERIENCE_HEADERS,
  LINK_HEADERS,
  matchBranch,
} from '@scout/shared';
import { SkillNormalizer } from './skill-normalizer';
import { LayoutDetector, ResumeLayoutProfile } from './layout-detector';
import { ParserRegistry } from './project-parser-strategies';

export interface ParsedResumeSection {
  educationText: string;
  projectsText: string;
  skillsText: string;
  experienceText: string;
  linksText: string;
  detectedLinks: Array<{ label: string; url: string }>;
  detectedGraduationYear?: number;
  detectedDegree?: string;
  detectedCollege?: string;
  detectedFieldOfStudy?: string;
  detectedProjects: Array<{
    title: string;
    description: string;
    technologies: string[];
    githubLink?: string;
    liveLink?: string;
  }>;
  detectedExperience: Array<{
    organization: string;
    role: string;
    startDate?: string;
    endDate?: string;
    description: string;
  }>;
  overallConfidence: number;
  warnings: string[];
  educationConfidence: number;
  projectsConfidence: number;
  experienceConfidence: number;
  skillsConfidence: number;
  layoutDetected: ResumeLayoutProfile;
}

export class ResumeSectionParser {
  static parse(rawText: string): ParsedResumeSection {
    const lines = rawText.split('\n');
    const sections = {
      education: [] as string[],
      projects: [] as string[],
      skills: [] as string[],
      experience: [] as string[],
      links: [] as string[],
      general: [] as string[],
    };

    let activeSection: keyof typeof sections = 'general';

    // Helper to identify header match
    const matchHeader = (line: string, headers: string[]): boolean => {
      const cleaned = line
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s&]/g, '');
      return headers.some(
        (h) => cleaned === h || cleaned.startsWith(h + ' ') || cleaned.endsWith(' ' + h),
      );
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (matchHeader(trimmed, EDUCATION_HEADERS)) {
        activeSection = 'education';
      } else if (matchHeader(trimmed, PROJECT_HEADERS)) {
        activeSection = 'projects';
      } else if (matchHeader(trimmed, SKILLS_HEADERS)) {
        activeSection = 'skills';
      } else if (matchHeader(trimmed, EXPERIENCE_HEADERS)) {
        activeSection = 'experience';
      } else if (matchHeader(trimmed, LINK_HEADERS)) {
        activeSection = 'links';
      } else {
        sections[activeSection].push(trimmed);
      }
    }

    const educationText = sections.education.join('\n');
    const projectsText = sections.projects.join('\n');
    const skillsText = sections.skills.join('\n');
    const experienceText = sections.experience.join('\n');
    const linksText = sections.links.join('\n');

    // Run Layout Detection
    const layoutDetected = LayoutDetector.detect(rawText, {
      educationText,
      projectsText,
      experienceText,
      skillsText,
    });

    // 1. Detect links using URL regex
    const detectedLinks: Array<{ label: string; url: string }> = [];
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const matches = rawText.match(urlRegex) || [];
    matches.forEach((url) => {
      const cleanUrl = url.replace(/[,;.\s)]+$/, '');
      let label = 'Portfolio';
      if (/github\.com/i.test(cleanUrl)) label = 'GitHub';
      else if (/linkedin\.com/i.test(cleanUrl)) label = 'LinkedIn';

      if (!detectedLinks.some((l) => l.url === cleanUrl)) {
        detectedLinks.push({ label, url: cleanUrl });
      }
    });

    // 2. Heuristics for education details
    let detectedGraduationYear: number | undefined;
    const gradYearRegex = /\b(202[0-9]|203[0-9])\b/g;
    const yearMatches = educationText.match(gradYearRegex);
    if (yearMatches && yearMatches.length > 0) {
      detectedGraduationYear = parseInt(yearMatches[yearMatches.length - 1], 10);
    }

    let detectedDegree: string | undefined;
    const degrees = [
      'B.Tech',
      'B.E.',
      'BCA',
      'B.Sc',
      'M.Tech',
      'MCA',
      'M.Sc',
      'B.Com',
      'M.Com',
      'Ph.D',
    ];
    for (const deg of degrees) {
      const reg = new RegExp('\\b' + deg.replace('.', '\\.') + '\\b', 'i');
      if (reg.test(educationText) || reg.test(rawText)) {
        detectedDegree = deg;
        break;
      }
    }

    let detectedCollege: string | undefined;
    const collegeRegex =
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:College|University|Institute|Academy|School|DTU|IIT|NIT|IIIT))/g;
    const collegeMatches = educationText.match(collegeRegex);
    if (collegeMatches && collegeMatches.length > 0) {
      detectedCollege = collegeMatches[0].trim();
    }

    // Match Engineering Branch
    const matchedBranch = matchBranch(educationText) || matchBranch(rawText);
    const detectedFieldOfStudy = matchedBranch ? matchedBranch.name : undefined;

    // 3. Project parsing using Layout Strategies from Registry
    const projectParser = ParserRegistry.getParser(layoutDetected.projectLayout);
    const parsedProjects = projectParser.parse(projectsText, rawText);
    const detectedProjects = parsedProjects.map((p) => ({
      title: p.title,
      description: p.description,
      technologies: p.technologies,
    }));

    // 4. Experience & Leadership parsing
    const detectedExperience: Array<{
      organization: string;
      role: string;
      startDate?: string;
      endDate?: string;
      description: string;
    }> = [];

    const expLines = experienceText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    let currentExp: (typeof detectedExperience)[0] | null = null;

    const roleKeywords = [
      'ambassador',
      'lead',
      'chair',
      'gdsc',
      'volunteer',
      'mentor',
      'coordinator',
      'organizer',
      'representative',
      'intern',
      'developer',
      'engineer',
      'manager',
      'officer',
      'specialist',
    ];
    const orgKeywords = [
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
    ];

    for (const line of expLines) {
      const lowerLine = line.toLowerCase();
      const hasRoleWord = roleKeywords.some((w) => lowerLine.includes(w));
      const isShort = line.length <= 80;

      // Extract dates
      let startDate: string | undefined;
      let endDate: string | undefined;
      const dateRangeRegex =
        /\b([A-Za-z]{3,9}\s+\d{4}|\d{4})\s*[-–—to\s]+\s*([A-Za-z]{3,9}\s+\d{4}|\d{4}|present)\b/i;
      const dateMatch = line.match(dateRangeRegex);
      let cleanRoleLine = line;

      if (dateMatch) {
        const parts = dateMatch[0].split(/(?:[-–—]|\bto\b)/i).map((s) => s.trim());
        startDate = parts[0];
        endDate = parts[1];
        cleanRoleLine = line.replace(dateMatch[0], '').trim();
      }

      cleanRoleLine = cleanRoleLine
        .replace(/\(\s*\)/g, '')
        .replace(/[-|@,\s]+$/, '')
        .trim();

      const wordCount = cleanRoleLine.split(/\s+/).filter(Boolean).length;

      // If layout is COMPANY_FIRST, check if the line fits organization heuristics
      const isNewSectionStart =
        layoutDetected.experienceLayout === 'COMPANY_FIRST'
          ? orgKeywords.some((w) => lowerLine.includes(w)) && isShort && wordCount <= 5
          : hasRoleWord && isShort && wordCount <= 5;

      if (isNewSectionStart) {
        if (currentExp) {
          detectedExperience.push(currentExp);
        }

        let organization = '';
        let role = cleanRoleLine;
        const separators = ['|', '@', ' at ', ' - '];

        for (const sep of separators) {
          if (cleanRoleLine.includes(sep)) {
            const parts = cleanRoleLine.split(sep).map((p) => p.trim());
            const part0Lower = parts[0].toLowerCase();
            const hasOrg0 = orgKeywords.some((o) => part0Lower.includes(o));
            if (hasOrg0) {
              organization = parts[0];
              role = parts[1] || parts[0];
            } else {
              organization = parts[1] || '';
              role = parts[0];
            }
            break;
          }
        }

        if (!organization) {
          for (const orgKw of orgKeywords) {
            const idx = lowerLine.indexOf(orgKw);
            if (idx !== -1) {
              organization = line.substring(idx, idx + orgKw.length);
              organization = organization.charAt(0).toUpperCase() + organization.slice(1);
              break;
            }
          }
        }

        currentExp = {
          organization: organization || 'Volunteer',
          role: role || 'Lead',
          startDate,
          endDate,
          description: '',
        };
      } else if (currentExp) {
        currentExp.description = currentExp.description
          ? currentExp.description + '\n' + line
          : line;
      }
    }
    if (currentExp) {
      detectedExperience.push(currentExp);
    }

    // 5. Individual section confidence scoring
    let educationConfidence = 0;
    if (sections.education.length > 0) {
      let eduPts = 0;
      if (detectedCollege) eduPts += 0.25;
      if (detectedDegree) eduPts += 0.25;
      if (detectedFieldOfStudy) eduPts += 0.25;
      if (detectedGraduationYear) eduPts += 0.25;
      educationConfidence = eduPts;
    }

    const projectsConfidence = detectedProjects.length > 0 ? 1.0 : 0.0;
    const experienceConfidence = detectedExperience.length > 0 ? 1.0 : 0.0;

    const normalizedSkills = SkillNormalizer.normalize(skillsText);
    const skillsConfidence = Math.min(normalizedSkills.length / 3, 1.0);

    // Warnings
    const warnings: string[] = [];
    if (!detectedCollege) warnings.push('Could not confidently detect college institution');
    if (!detectedFieldOfStudy) warnings.push('Could not confidently detect engineering branch');
    if (detectedProjects.length === 0) warnings.push('Projects section missing');
    if (detectedExperience.length === 0) warnings.push('Experience/Leadership section missing');

    const overallConfidence = parseFloat(
      (
        (educationConfidence + projectsConfidence + experienceConfidence + skillsConfidence) /
        4
      ).toFixed(2),
    );

    return {
      educationText,
      projectsText,
      skillsText,
      experienceText,
      linksText,
      detectedLinks,
      detectedGraduationYear,
      detectedDegree,
      detectedCollege,
      detectedFieldOfStudy,
      detectedProjects,
      detectedExperience,
      overallConfidence,
      warnings,
      educationConfidence,
      projectsConfidence,
      experienceConfidence,
      skillsConfidence,
      layoutDetected,
    };
  }
}

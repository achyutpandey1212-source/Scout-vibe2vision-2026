import { CandidateSnapshot } from './candidate-snapshot';

export interface StructuredProjectEvidence {
  title: string;
  category: string;
  technologies: string[];
  summary: string;
  highlights: string[];
}

export interface ResumeContext {
  summary: string;
  topProjects: StructuredProjectEvidence[];
  topTechnologies: string[];
  strongestAreas: string[];
  careerStory: string;
  projectHighlights: string[];
  experienceHighlights: string[];
  formattedContext: string;
}

export class ResumeContextBuilder {
  /**
   * Transforms CandidateSnapshot into structured, resume-aware evidence
   * for LLM personalization and deterministic fallback generation.
   */
  public build(snapshot: CandidateSnapshot): ResumeContext {
    // 1. Format Top Projects into Structured Evidence
    const topProjects: StructuredProjectEvidence[] = snapshot.projects.map((proj) => {
      const highlights: string[] = [];
      const text = `${proj.title} ${proj.summary} ${proj.technologies.join(' ')}`.toLowerCase();

      if (text.includes('crawl') || text.includes('agent') || text.includes('langgraph')) {
        highlights.push('Built autonomous discovery / agent pipelines');
      }
      if (text.includes('api') || text.includes('express') || text.includes('rest')) {
        highlights.push('Designed RESTful backend API architectures');
      }
      if (
        text.includes('mongo') ||
        text.includes('redis') ||
        text.includes('sql') ||
        text.includes('db')
      ) {
        highlights.push('Implemented data persistence & caching layers');
      }
      if (text.includes('react') || text.includes('extension') || text.includes('frontend')) {
        highlights.push('Created interactive web & UI interfaces');
      }
      if (text.includes('docker') || text.includes('cloud') || text.includes('firebase')) {
        highlights.push('Configured cloud infrastructure & deployment');
      }
      if (highlights.length === 0) {
        highlights.push('Implemented end-to-end software features');
      }

      return {
        title: proj.title,
        category: proj.category,
        technologies: proj.technologies,
        summary: proj.summary,
        highlights,
      };
    });

    // 2. Format Experience Highlights
    const experienceHighlights = snapshot.experience.map((exp) => `${exp.role} at ${exp.company}`);

    // 3. Format Strongest Technologies & Areas
    const topTechnologies = snapshot.strongestTechnologies;
    const strongestAreas = snapshot.strengths;

    // 4. Construct Narrative Career Story
    const eduDegree = snapshot.education.degree || 'Degree';
    const eduBranch = snapshot.education.branch || 'Engineering';
    const yearStr = snapshot.education.currentYear
      ? `${snapshot.education.currentYear}th year `
      : '';
    const careerStory = `${yearStr}${eduBranch} (${eduDegree}) student with a strong profile in ${strongestAreas.slice(0, 2).join(' and ')}. Has built ${snapshot.projects.length} key project(s) demonstrating hands-on software construction beyond coursework.`;

    // 5. Construct Structured Text Output for LLM Prompts
    const projectBlocks =
      topProjects.length > 0
        ? topProjects
            .map(
              (p) => `• ${p.title}
  Category: ${p.category}
  Key Technologies: ${p.technologies.join(', ') || 'N/A'}
  Summary: ${p.summary || 'N/A'}
  Highlights:
    - ${p.highlights.join('\n    - ')}`,
            )
            .join('\n\n')
        : 'No explicit projects listed on resume.';

    const expBlocks =
      experienceHighlights.length > 0
        ? experienceHighlights.map((e) => `• ${e}`).join('\n')
        : 'No prior professional work experience listed.';

    const formattedContext = `========== Candidate Summary ==========
Education: ${snapshot.education.currentYear ? `${snapshot.education.currentYear}th year ` : ''}${snapshot.education.branch || 'Engineering'} (${snapshot.education.degree || 'Degree'})
Persona: ${snapshot.persona}
Career Story: ${careerStory}

Strongest Technical Areas:
${strongestAreas.map((a) => `• ${a}`).join('\n')}

Structured Projects Evidence:
${projectBlocks}

Prior Experience:
${expBlocks}

Strongest Technologies:
${topTechnologies.join(', ')}

Career Goals:
${snapshot.goals.map((g) => `• ${g}`).join('\n') || '• First Internship'}

Targeted Roles:
${snapshot.preferredRoles.join(', ')}
======================================`;

    const summary = `${careerStory} Strongest technologies: ${topTechnologies.join(', ')}.`;

    const projectHighlights = topProjects.flatMap((p) => p.highlights);

    return {
      summary,
      topProjects,
      topTechnologies,
      strongestAreas,
      careerStory,
      projectHighlights,
      experienceHighlights,
      formattedContext,
    };
  }
}

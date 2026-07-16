import { SkillNormalizer } from './skill-normalizer';

export interface ExtractedProject {
  title: string;
  description: string;
  technologies: string[];
}

export interface ProjectParserStrategy {
  parse(projectsText: string, _rawText: string): ExtractedProject[];
}

// 1. NumberedProjectParser
export class NumberedProjectParser implements ProjectParserStrategy {
  parse(projectsText: string, _rawText: string): ExtractedProject[] {
    const projectLines = projectsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const blocks: Array<{ rawTitleLine: string; bodyLines: string[] }> = [];
    let currentBlock: (typeof blocks)[0] | null = null;

    for (const line of projectLines) {
      const startsWithNumber = /^\s*\d+[.)]\s+(.*)/.test(line);
      if (startsWithNumber) {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { rawTitleLine: line, bodyLines: [] };
      } else if (currentBlock) {
        currentBlock.bodyLines.push(line);
      }
    }
    if (currentBlock) blocks.push(currentBlock);

    return parseBlocks(blocks);
  }
}

// 2. HeadingProjectParser
export class HeadingProjectParser implements ProjectParserStrategy {
  parse(projectsText: string, _rawText: string): ExtractedProject[] {
    const projectLines = projectsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const blocks: Array<{ rawTitleLine: string; bodyLines: string[] }> = [];
    let currentBlock: (typeof blocks)[0] | null = null;
    const noisePrefixes = [
      'github',
      'live demo',
      'google docs',
      'tech:',
      'technologies:',
      'built',
      'designed',
      'integrated',
      'architected',
      'reflection.',
      'switching and future extensibility.',
    ];

    for (const line of projectLines) {
      const lower = line.toLowerCase();
      const startsWithSymbol = /^\s*[■●▪•\-*]\s+/.test(line);
      const isNoise =
        noisePrefixes.some((p) => lower.startsWith(p)) ||
        lower.includes('|') ||
        line.includes('•') ||
        line.includes('▪') ||
        (line.includes(',') && line.split(',').length >= 3);

      const isTitleLine =
        startsWithSymbol ||
        (line.length <= 40 && line.split(/\s+/).length <= 4 && !isNoise && /^[A-Z0-9]/.test(line));

      if (isTitleLine) {
        if (currentBlock) blocks.push(currentBlock);
        const cleanTitle = line.replace(/^\s*[■●▪•\-*]\s*/, '').trim();
        currentBlock = { rawTitleLine: cleanTitle, bodyLines: [] };
      } else if (currentBlock) {
        currentBlock.bodyLines.push(line);
      }
    }
    if (currentBlock) blocks.push(currentBlock);

    return parseBlocks(blocks);
  }
}

// 3. ATSProjectParser
export class ATSProjectParser implements ProjectParserStrategy {
  parse(projectsText: string, _rawText: string): ExtractedProject[] {
    const projectLines = projectsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const blocks: Array<{ rawTitleLine: string; bodyLines: string[] }> = [];
    let currentBlock: (typeof blocks)[0] | null = null;
    const noisePrefixes = [
      'github',
      'live demo',
      'google docs',
      'tech:',
      'technologies:',
      'built',
      'designed',
      'integrated',
      'architected',
      'reflection.',
    ];

    for (const line of projectLines) {
      const lower = line.toLowerCase();
      const isNoise =
        noisePrefixes.some((p) => lower.startsWith(p)) ||
        lower.includes('|') ||
        line.includes('•') ||
        line.includes('▪') ||
        (line.includes(',') && line.split(',').length >= 3);

      const isTitleLine =
        line.length <= 50 && line.split(/\s+/).length <= 5 && !isNoise && /^[A-Z0-9]/.test(line);

      if (isTitleLine) {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { rawTitleLine: line, bodyLines: [] };
      } else if (currentBlock) {
        currentBlock.bodyLines.push(line);
      }
    }
    if (currentBlock) blocks.push(currentBlock);

    return parseBlocks(blocks);
  }
}

// 4. GenericProjectParser
export class GenericProjectParser implements ProjectParserStrategy {
  parse(projectsText: string, _rawText: string): ExtractedProject[] {
    const projectLines = projectsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const blocks: Array<{ rawTitleLine: string; bodyLines: string[] }> = [];
    let currentBlock: (typeof blocks)[0] | null = null;
    const noisePrefixes = [
      'github',
      'live demo',
      'google docs',
      'tech:',
      'technologies:',
      'built',
      'designed',
      'integrated',
      'architected',
    ];

    for (const line of projectLines) {
      const lower = line.toLowerCase();
      const isNoise = noisePrefixes.some((p) => lower.startsWith(p)) || lower.includes('|');
      const isTitleLine =
        line.length <= 40 && line.split(/\s+/).length <= 4 && !isNoise && /^[A-Z0-9]/.test(line);

      if (isTitleLine) {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { rawTitleLine: line, bodyLines: [] };
      } else if (currentBlock) {
        currentBlock.bodyLines.push(line);
      }
    }
    if (currentBlock) blocks.push(currentBlock);

    return parseBlocks(blocks);
  }
}

// Helper to parse blocks
function parseBlocks(
  blocks: Array<{ rawTitleLine: string; bodyLines: string[] }>,
): ExtractedProject[] {
  const result: ExtractedProject[] = [];
  const techHeaders = [
    'tech stack',
    'built using',
    'backend',
    'frontend',
    'database',
    'cloud',
    'ai models',
    'apis',
    'tech:',
    'technologies:',
  ];

  for (const block of blocks) {
    let title = block.rawTitleLine.replace(/^\d+[.)]\s*/, '').trim();
    title = title.replace(/[\s—\-:]+$/, '').trim();

    const descLines: string[] = [];
    const techLines: string[] = [];

    for (const line of block.bodyLines) {
      const lower = line.toLowerCase();
      const isLinkLine =
        lower.includes('github') ||
        lower.includes('live demo') ||
        lower.includes('google docs') ||
        lower.includes('|') ||
        lower.startsWith('http');
      if (isLinkLine) continue;

      const hasTechHeader = techHeaders.some((h) => lower.startsWith(h));
      if (hasTechHeader) {
        techLines.push(line);
      } else {
        descLines.push(line);
      }
    }

    const techSet = new Set<string>();
    for (const tl of techLines) {
      const content = tl
        .replace(
          /^(tech stack|built using|backend|frontend|database|cloud|ai models|apis|tech:|technologies:)/i,
          '',
        )
        .trim();
      const rawTechs = content
        .split(/[•,;/\s]/)
        .map((t) => t.trim())
        .filter(Boolean);
      for (const t of rawTechs) {
        const normalized = SkillNormalizer.normalize(t);
        normalized.forEach((id) => techSet.add(id));
      }
    }

    const fullBlockText = block.rawTitleLine + ' ' + block.bodyLines.join(' ');
    const scannedTechs = SkillNormalizer.normalize(fullBlockText);
    scannedTechs.forEach((id) => techSet.add(id));

    const technologies = Array.from(techSet);
    const description = descLines.join('\n').trim();

    if (title && description) {
      result.push({ title, description, technologies });
    }
  }
  return result;
}

// 5. Parser Registry
export class ParserRegistry {
  private static strategies = new Map<string, ProjectParserStrategy>();

  static register(layoutType: string, strategy: ProjectParserStrategy) {
    this.strategies.set(layoutType, strategy);
  }

  static getParser(layoutType: string): ProjectParserStrategy {
    return this.strategies.get(layoutType) || new GenericProjectParser();
  }
}

// Register default strategies
ParserRegistry.register('NUMBERED', new NumberedProjectParser());
ParserRegistry.register('HEADING', new HeadingProjectParser());
ParserRegistry.register('ATS', new ATSProjectParser());
ParserRegistry.register('GENERIC', new GenericProjectParser());

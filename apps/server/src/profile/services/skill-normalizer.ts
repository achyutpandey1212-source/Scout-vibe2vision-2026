import { SKILLS_TAXONOMY } from '@scout/shared';

export class SkillNormalizer {
  static normalize(skillsText: string): string[] {
    const detectedIds = new Set<string>();

    // Normalize punctuation to ease token boundary check
    const normalizedText = skillsText
      .replace(/[,;/|\\•*().:-]/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase();

    for (const skill of SKILLS_TAXONOMY) {
      // Escape special characters in skill name for regex safety (e.g. C++)
      const escapedName = skill.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

      // Look for boundary matching, allowing symbols like + or # to wrap correctly
      const nameRegex = new RegExp(`(?:^|\\s)${escapedName}(?:$|\\s)`, 'i');
      if (nameRegex.test(normalizedText)) {
        detectedIds.add(skill.id);
        continue;
      }

      // Check aliases
      for (const alias of skill.aliases) {
        const escapedAlias = alias.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const aliasRegex = new RegExp(`(?:^|\\s)${escapedAlias}(?:$|\\s)`, 'i');
        if (aliasRegex.test(normalizedText)) {
          detectedIds.add(skill.id);
          break;
        }
      }
    }

    return Array.from(detectedIds);
  }
}

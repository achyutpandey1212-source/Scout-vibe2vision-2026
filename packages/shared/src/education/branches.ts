export interface BranchInfo {
  id: string;
  name: string;
  aliases: string[];
}

export const ENGINEERING_BRANCHES: BranchInfo[] = [
  {
    id: 'cse',
    name: 'Computer Science Engineering',
    aliases: [
      'computer science',
      'cse',
      'computer engineering',
      'computer science and engineering',
    ],
  },
  {
    id: 'ece',
    name: 'Electronics and Communication Engineering',
    aliases: [
      'electronics & communication',
      'electronics and communication engineering',
      'electronics and communication',
      'ece',
    ],
  },
  {
    id: 'it',
    name: 'Information Technology',
    aliases: ['it', 'information technology', 'information technology engineering'],
  },
  {
    id: 'ai',
    name: 'Artificial Intelligence',
    aliases: [
      'artificial intelligence',
      'ai',
      'artificial intelligence and machine learning',
      'ai/ml',
      'ai & ml',
    ],
  },
  {
    id: 'me',
    name: 'Mechanical Engineering',
    aliases: ['mechanical engineering', 'mechanical', 'me'],
  },
  {
    id: 'ce',
    name: 'Civil Engineering',
    aliases: ['civil engineering', 'civil', 'ce'],
  },
  {
    id: 'ee',
    name: 'Electrical Engineering',
    aliases: ['electrical engineering', 'electrical', 'ee'],
  },
];

export function matchBranch(text: string): BranchInfo | undefined {
  const clean = text.toLowerCase().trim();
  // Check exact name match first
  const exact = ENGINEERING_BRANCHES.find((b) => b.name.toLowerCase() === clean);
  if (exact) return exact;

  // Then check alias inclusion
  return ENGINEERING_BRANCHES.find((b) =>
    b.aliases.some((alias) => clean.includes(alias) || alias === clean),
  );
}

export function normalizeBranch(text: string): string {
  const match = matchBranch(text);
  return match ? match.name : text;
}

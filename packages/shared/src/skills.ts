export type Skill = {
  id: string;
  name: string;
  aliases: string[];
  category: string;
};

export const SKILLS_TAXONOMY: Skill[] = [
  // Languages
  { id: 'javascript', name: 'JavaScript', aliases: ['js', 'ecmascript'], category: 'Languages' },
  { id: 'typescript', name: 'TypeScript', aliases: ['ts'], category: 'Languages' },
  { id: 'python', name: 'Python', aliases: ['py'], category: 'Languages' },
  { id: 'java', name: 'Java', aliases: [], category: 'Languages' },
  { id: 'cpp', name: 'C++', aliases: ['cplusplus', 'cpp'], category: 'Languages' },
  { id: 'c', name: 'C', aliases: [], category: 'Languages' },
  { id: 'csharp', name: 'C#', aliases: ['c-sharp', 'csharp'], category: 'Languages' },
  { id: 'go', name: 'Go', aliases: ['golang'], category: 'Languages' },
  { id: 'rust', name: 'Rust', aliases: [], category: 'Languages' },
  { id: 'ruby', name: 'Ruby', aliases: ['rails'], category: 'Languages' },
  { id: 'php', name: 'PHP', aliases: [], category: 'Languages' },
  { id: 'swift', name: 'Swift', aliases: [], category: 'Languages' },
  { id: 'kotlin', name: 'Kotlin', aliases: [], category: 'Languages' },
  { id: 'html', name: 'HTML', aliases: ['html5'], category: 'Languages' },
  { id: 'css', name: 'CSS', aliases: ['css3'], category: 'Languages' },
  { id: 'sql', name: 'SQL', aliases: [], category: 'Languages' },

  // Frontend
  { id: 'react', name: 'React', aliases: ['reactjs', 'react.js'], category: 'Frontend' },
  { id: 'nextjs', name: 'Next.js', aliases: ['next.js', 'next'], category: 'Frontend' },
  { id: 'vue', name: 'Vue.js', aliases: ['vue', 'vuejs'], category: 'Frontend' },
  { id: 'angular', name: 'Angular', aliases: ['angularjs'], category: 'Frontend' },
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    aliases: ['tailwind', 'tailwindcss'],
    category: 'Frontend',
  },
  { id: 'bootstrap', name: 'Bootstrap', aliases: [], category: 'Frontend' },
  { id: 'sass', name: 'Sass', aliases: ['scss'], category: 'Frontend' },
  { id: 'flutter', name: 'Flutter', aliases: [], category: 'Frontend' },
  { id: 'reactnative', name: 'React Native', aliases: [], category: 'Frontend' },

  // Backend
  { id: 'nodejs', name: 'Node.js', aliases: ['node.js', 'node'], category: 'Backend' },
  { id: 'express', name: 'Express', aliases: ['expressjs', 'express.js'], category: 'Backend' },
  { id: 'django', name: 'Django', aliases: [], category: 'Backend' },
  { id: 'flask', name: 'Flask', aliases: [], category: 'Backend' },
  { id: 'springboot', name: 'Spring Boot', aliases: ['spring'], category: 'Backend' },
  { id: 'fastapi', name: 'FastAPI', aliases: [], category: 'Backend' },
  { id: 'graphql', name: 'GraphQL', aliases: [], category: 'Backend' },

  // Databases
  { id: 'mongodb', name: 'MongoDB', aliases: ['mongo'], category: 'Database' },
  { id: 'postgresql', name: 'PostgreSQL', aliases: ['postgres'], category: 'Database' },
  { id: 'mysql', name: 'MySQL', aliases: [], category: 'Database' },
  { id: 'redis', name: 'Redis', aliases: [], category: 'Database' },
  { id: 'firebase', name: 'Firebase', aliases: ['firestore'], category: 'Database' },
  { id: 'sqlite', name: 'SQLite', aliases: [], category: 'Database' },

  // Cloud & DevOps
  { id: 'docker', name: 'Docker', aliases: [], category: 'DevOps' },
  { id: 'kubernetes', name: 'Kubernetes', aliases: ['k8s'], category: 'DevOps' },
  { id: 'git', name: 'Git', aliases: ['github', 'gitlab'], category: 'Tools' },
  { id: 'aws', name: 'AWS', aliases: ['amazon web services'], category: 'Cloud' },
  { id: 'gcp', name: 'GCP', aliases: ['google cloud', 'google cloud platform'], category: 'Cloud' },
  { id: 'azure', name: 'Azure', aliases: ['microsoft azure'], category: 'Cloud' },
  {
    id: 'cloudrun',
    name: 'Google Cloud Run',
    aliases: ['cloud run', 'google cloud run'],
    category: 'Cloud',
  },
  { id: 'vercel', name: 'Vercel', aliases: [], category: 'Tools' },

  // AI & Data Science
  { id: 'tensorflow', name: 'TensorFlow', aliases: ['tf'], category: 'AI/ML' },
  { id: 'pytorch', name: 'PyTorch', aliases: [], category: 'AI/ML' },
  { id: 'pandas', name: 'Pandas', aliases: [], category: 'AI/ML' },
  { id: 'numpy', name: 'NumPy', aliases: [], category: 'AI/ML' },
  { id: 'scikitlearn', name: 'Scikit-Learn', aliases: ['sklearn'], category: 'AI/ML' },
  { id: 'langchain', name: 'LangChain', aliases: [], category: 'AI/ML' },
  { id: 'langgraph', name: 'LangGraph', aliases: [], category: 'AI/ML' },
  { id: 'gemini', name: 'Gemini API', aliases: ['gemini', 'gemini api'], category: 'AI/ML' },

  // Design & Others
  { id: 'figma', name: 'Figma', aliases: [], category: 'Design' },
  { id: 'adobexd', name: 'Adobe XD', aliases: [], category: 'Design' },
  { id: 'postman', name: 'Postman', aliases: [], category: 'Tools' },
  { id: 'vscode', name: 'VS Code', aliases: ['vscode', 'visual studio code'], category: 'Tools' },

  // APIs, Auth & Libraries
  {
    id: 'googlecalendarapi',
    name: 'Google Calendar API',
    aliases: ['google calendar api', 'google calendar'],
    category: 'APIs',
  },
  { id: 'resend', name: 'Resend', aliases: [], category: 'APIs' },
  { id: 'restapi', name: 'REST API', aliases: ['rest api', 'rest apis'], category: 'APIs' },
  { id: 'jwt', name: 'JSON Web Token', aliases: ['jwt', 'json web token'], category: 'Auth' },
  { id: 'bcrypt', name: 'Bcrypt', aliases: [], category: 'Auth' },
  {
    id: 'firebaseauth',
    name: 'Firebase Authentication',
    aliases: ['firebase authentication', 'firebase auth'],
    category: 'Auth',
  },
  { id: 'imagekit', name: 'ImageKit', aliases: [], category: 'Tools' },
  { id: 'multer', name: 'Multer', aliases: [], category: 'Tools' },
];

export const SKILLS_VERSION = '2026.1';

export const SKILLS_METADATA = {
  version: SKILLS_VERSION,
  source: 'Open Source Developer Skills Taxonomy',
  updatedAt: '2026-07-16T11:24:56Z',
};

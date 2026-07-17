export type EngineeringDomain =
  | 'ai-ml'
  | 'backend'
  | 'frontend'
  | 'fullstack'
  | 'cloud'
  | 'devops'
  | 'cybersecurity'
  | 'data-science'
  | 'mobile'
  | 'embedded'
  | 'robotics'
  | 'semiconductor'
  | 'blockchain'
  | 'game-dev'
  | 'qa-testing'
  | 'ui-ux';

export interface EngineeringDomainInfo {
  id: EngineeringDomain;
  name: string;
  keywords: string[];
}

export const ENGINEERING_DOMAIN_TAXONOMY: EngineeringDomainInfo[] = [
  {
    id: 'ai-ml',
    name: 'AI / Machine Learning',
    keywords: [
      'ai',
      'artificial intelligence',
      'machine learning',
      'ml',
      'deep learning',
      'neural networks',
      'nlp',
      'computer vision',
      'llm',
      'generative ai',
      'genai',
    ],
  },
  {
    id: 'backend',
    name: 'Backend Development',
    keywords: [
      'backend',
      'back-end',
      'node',
      'nodejs',
      'express',
      'nest',
      'nestjs',
      'python',
      'django',
      'flask',
      'fastapi',
      'java',
      'spring',
      'springboot',
      'go',
      'golang',
      'rust',
      'ruby',
      'rails',
      'sql',
      'postgresql',
      'mongodb',
      'redis',
      'database',
      'api',
      'graphql',
    ],
  },
  {
    id: 'frontend',
    name: 'Frontend Development',
    keywords: [
      'frontend',
      'front-end',
      'react',
      'reactjs',
      'vue',
      'vuejs',
      'angular',
      'svelte',
      'nextjs',
      'next.js',
      'html',
      'css',
      'sass',
      'tailwind',
      'javascript',
      'typescript',
      'webpack',
      'vite',
    ],
  },
  {
    id: 'fullstack',
    name: 'Full Stack Development',
    keywords: ['full stack', 'fullstack', 'full-stack', 'mern', 'mean', 'jamstack'],
  },
  {
    id: 'cloud',
    name: 'Cloud Computing',
    keywords: [
      'cloud',
      'aws',
      'azure',
      'gcp',
      'google cloud',
      'kubernetes',
      'docker',
      'iaas',
      'paas',
      'serverless',
    ],
  },
  {
    id: 'devops',
    name: 'DevOps / SRE',
    keywords: [
      'devops',
      'ci/cd',
      'sre',
      'site reliability',
      'terraform',
      'ansible',
      'jenkins',
      'github actions',
      'gitlab ci',
    ],
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    keywords: [
      'cyber',
      'security',
      'penetration testing',
      'pentest',
      'ethical hacking',
      'infosec',
      'vulnerability',
      'siem',
      'firewall',
    ],
  },
  {
    id: 'data-science',
    name: 'Data Science',
    keywords: [
      'data science',
      'data analytics',
      'analytics',
      'sql',
      'pandas',
      'numpy',
      'tableau',
      'power bi',
      'statistics',
      'visualization',
    ],
  },
  {
    id: 'mobile',
    name: 'Mobile Development',
    keywords: [
      'mobile',
      'android',
      'ios',
      'flutter',
      'react native',
      'swift',
      'kotlin',
      'dart',
      'mobile app',
    ],
  },
  {
    id: 'embedded',
    name: 'Embedded Systems / IoT',
    keywords: [
      'embedded',
      'iot',
      'internet of things',
      'hardware',
      'firmware',
      'microcontroller',
      'arduino',
      'raspberry pi',
      'rtos',
    ],
  },
  {
    id: 'robotics',
    name: 'Robotics',
    keywords: ['robot', 'robotics', 'ros', 'ros2', 'autonomous', 'drone', 'uav'],
  },
  {
    id: 'semiconductor',
    name: 'Semiconductor / VLSI',
    keywords: ['semiconductor', 'vlsi', 'fpga', 'asic', 'chip design', 'verilog', 'vhdl', 'eda'],
  },
  {
    id: 'blockchain',
    name: 'Blockchain / Web3',
    keywords: [
      'blockchain',
      'web3',
      'solidity',
      'ethereum',
      'smart contract',
      'crypto',
      'defi',
      'nft',
    ],
  },
  {
    id: 'game-dev',
    name: 'Game Development',
    keywords: [
      'game development',
      'gamedev',
      'unity',
      'unreal engine',
      'game design',
      'c#',
      'csharp',
    ],
  },
  {
    id: 'qa-testing',
    name: 'QA / Testing',
    keywords: [
      'qa',
      'testing',
      'automation',
      'selenium',
      'jest',
      'cypress',
      'junit',
      'testng',
      'quality assurance',
    ],
  },
  {
    id: 'ui-ux',
    name: 'UI/UX Design',
    keywords: [
      'ui',
      'ux',
      'user interface',
      'user experience',
      'figma',
      'sketch',
      'adobe xd',
      'prototyping',
      'wireframe',
    ],
  },
];

export const ENGINEERING_DOMAIN_IDS = ENGINEERING_DOMAIN_TAXONOMY.map((d) => d.id);

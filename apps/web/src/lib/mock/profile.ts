export interface UserProfileDetails {
  name: string;
  email: string;
  location: string;
  stage: string;
  dreams: string[];
  interests: string[];
  skills: string[];
  goals: string[];
  companionPreferences: {
    dailyBrief: boolean;
    weeklyDigest: boolean;
    exploreFrequency: '6h' | '12h' | '24h';
    minimumMatchScore: number;
  };
}

export const mockProfile: UserProfileDetails = {
  name: 'Maya Sharma',
  email: 'maya.sharma@tier3college.edu',
  location: 'New Delhi, India',
  stage: 'Final Year BCA Student',
  dreams: [
    'Secure a full-time product engineering role at a design-driven tech company.',
    'Build applications that solve real information inequality problems.',
    'Contribute to open-source developer tooling.',
  ],
  interests: [
    'Frontend Engineering',
    'UI/UX Design Systems',
    'Generative AI Applications',
    'Web Accessibility',
  ],
  skills: [
    'React JS',
    'Node JS',
    'Python',
    'Tailwind CSS',
    'Mongo DB',
    'UI Design',
    'NextJS App Router',
  ],
  goals: [
    'Complete three high-quality MERN stack side projects.',
    'Gain hands-on experience in cloud deployments and pipeline setups.',
    'Obtain travel grants to attend global developer conferences.',
  ],
  companionPreferences: {
    dailyBrief: true,
    weeklyDigest: false,
    exploreFrequency: '6h',
    minimumMatchScore: 75,
  },
};

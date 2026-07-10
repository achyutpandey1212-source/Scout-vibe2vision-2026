export interface MockOpportunity {
  id: string;
  title: string;
  organization: string;
  description: string;
  summary: string;
  category: 'JOB' | 'INTERNSHIP' | 'SCHOLARSHIP' | 'FELLOWSHIP' | 'GRANT' | 'FREELANCE';
  deadline: string;
  matchScore: number;
  tags: string[];
  isWomenOnly?: boolean;
  stipend?: string;
  isHiddenGem?: boolean;
  isFeatured?: boolean;
  about: string;
  eligibility: string;
  benefits: string;
  requirements: string[];
  applicationUrl: string;
  sourceURL: string;
}

export const mockOpportunities: MockOpportunity[] = [
  {
    id: 'opp-wtm-2026',
    title: 'Women Techmakers Scholars Program 2026',
    organization: 'Google India',
    description:
      'Google Women Techmakers Scholars receive academic financial support to cover tuition fees, participate in professional developer workshops, and receive direct mentorship from Google engineers to accelerate their coding careers.',
    summary:
      'A prestigious global scholarship and mentorship program providing financial aid and career guidance to outstanding women in computing fields.',
    category: 'SCHOLARSHIP',
    deadline: 'July 25, 2026',
    matchScore: 96,
    tags: ['Engineering', 'Scholarship', 'Mentorship'],
    isWomenOnly: true,
    stipend: '₹1,50,000 Support',
    isFeatured: true,
    about:
      'Google established the Women Techmakers Scholars Program (formerly the Anita Borg Memorial Scholarship) to support women pursuing degrees in computer science and technology. By offering financial assistance, professional workshops, and community mentorship, Google aims to reduce barriers and foster gender equality in the global tech sector.',
    eligibility:
      'Currently enrolled as a full-time undergraduate student in a university in India/APAC for the 2025-2026 academic year. Pursuing a degree in Computer Science, Computer Engineering, or a closely related technical field, and demonstrating strong academic performance.',
    benefits:
      'A one-time financial support payment to cover tuition or university costs, an invitation to attend an all-expenses-paid development retreat at a Google office, and continuous access to a global network of WTM alumni.',
    requirements: [
      'Complete online application form with personal details',
      'Submit academic transcripts and current CV / Resume',
      'Write two essay responses detailing technical leadership and career aspirations',
      'Provide a reference contact',
    ],
    applicationUrl:
      'https://buildyourfuture.withgoogle.com/scholarships/women-techmakers-scholars-program',
    sourceURL:
      'https://buildyourfuture.withgoogle.com/scholarships/women-techmakers-scholars-program',
  },
  {
    id: 'opp-qualcomm-wetech',
    title: 'WeTech Qualcomm Global Scholarship',
    organization: 'IIE Global',
    description:
      'This program awards scholarships to female students in India pursuing engineering and technology degrees, providing them with financial aid and six months of 1-to-1 mentorship with a senior engineer from Qualcomm.',
    summary:
      'A selective scholarship for female engineering students combining financial funding and Qualcomm career mentorship.',
    category: 'SCHOLARSHIP',
    deadline: 'July 31, 2026',
    matchScore: 91,
    tags: ['Qualcomm', 'Engineering', 'Mentorship'],
    isWomenOnly: true,
    stipend: '₹80,000 Support',
    isHiddenGem: true,
    about:
      'In partnership with Qualcomm, the Institute of International Education (IIE) administers the WeTech Qualcomm Global Scholarship to support women entering STEM workforces. The program aims to enrich the engineering field by promoting diversity and equipping women with practical career development tools.',
    eligibility:
      'Open to female undergraduate students in India entering their 2nd or 3rd year of undergraduate studies in Computer Science, Electrical Engineering, or related fields.',
    benefits:
      'A cash scholarship of ₹80,000 to assist with educational expenses, alongside a structured 6-month mentorship program paired with a Qualcomm tech lead to guide career preparation.',
    requirements: [
      'Online application form',
      'Academic records illustrating a GPA of 3.0 or equivalent',
      'One letter of recommendation from a university faculty member',
      'Short essay responses',
    ],
    applicationUrl: 'https://www.iie.org/programs/wetech',
    sourceURL: 'https://www.iie.org/programs/wetech',
  },
  {
    id: 'opp-zenkai-mern',
    title: 'Software Engineer Intern (MERN Stack)',
    organization: 'Zenkai Labs',
    description:
      'Join Zenkai Labs as a MERN stack engineering intern to help build the next generation of Opportunity Intelligence tools. You will work closely with senior engineers to deploy user-facing web applications using React, Node.js, and MongoDB.',
    summary:
      'A 6-month remote developer internship working on production React/Node.js products with modern engineering pipelines.',
    category: 'INTERNSHIP',
    deadline: 'August 12, 2026',
    matchScore: 89,
    tags: ['React', 'NodeJS', 'Remote'],
    isWomenOnly: true,
    stipend: '₹45,000/mo',
    about:
      'Zenkai Labs is a product studio focused on building high-trust, AI-assisted productivity tools. As an intern, you will contribute directly to our flagship applications, writing clean code, deploying API endpoints, and participating in code reviews.',
    eligibility:
      'Pre-final or final year students pursuing BCA, MCA, B.Tech or equivalent. Strong foundational knowledge in JavaScript/TypeScript, React, Node.js, and general database principles (SQL or NoSQL).',
    benefits:
      'Competitive monthly stipend, fully remote work environment, flexible working hours, and potential for transition to a full-time engineering position after internship completion.',
    requirements: [
      'Submit CV and link to portfolio or GitHub repository',
      'Complete a take-home coding challenge (implementing a simple React component and API)',
      'Technical interview covering JavaScript fundamentals and React rendering cycles',
    ],
    applicationUrl: 'https://labs.zenkai.dev/careers',
    sourceURL: 'https://labs.zenkai.dev/careers',
  },
  {
    id: 'opp-swe-grant',
    title: 'SWE Headquarter Travel Grant',
    organization: 'Society of Women Engineers',
    description:
      'The Society of Women Engineers (SWE) provides grants to support students attending the national SWE conference. Grants cover registration fees, travel expenses, and accommodation packages.',
    summary:
      'Travel grant assisting female engineering students to attend the annual SWE conference for networking and job opportunities.',
    category: 'GRANT',
    deadline: 'August 18, 2026',
    matchScore: 85,
    tags: ['Conference', 'Grant', 'Networking'],
    isWomenOnly: true,
    stipend: 'Travel & Accommodation covered',
    isHiddenGem: true,
    about:
      'SWE is a global organization serving as the advocate and catalyst for change for women in engineering and technology. The Travel Grant ensures students from underrepresented networks or tier-3 universities can participate in the annual SWE career fair, meeting hundreds of global recruiters.',
    eligibility:
      'Active collegiate membership in SWE. Enrollment in an engineering or technical degree. Priority is given to students presenting research or attending for the first time.',
    benefits:
      'Full conference registration ticket, round-trip economy flights, and shared hotel accommodation during the 3-day conference event.',
    requirements: [
      'Valid SWE member ID',
      'Submit essay detailing how attending the conference will impact your career path',
      'Letter of endorsement from SWE collegiate section advisor or dean',
    ],
    applicationUrl: 'https://swe.org/scholarships-and-grants',
    sourceURL: 'https://swe.org/scholarships-and-grants',
  },
  {
    id: 'opp-notion-pm',
    title: 'Product Management Fellow',
    organization: 'Notion HQ',
    description:
      'Notion is offering a 3-month Product Management Fellowship. Fellows will own a product vertical, conduct user research, write spec documents, and collaborate with design and engineering teams to launch a feature.',
    summary:
      'A fast-paced PM fellowship at Notion for aspiring product leads to own and launch consumer-facing editor features.',
    category: 'FELLOWSHIP',
    deadline: 'July 31, 2026',
    matchScore: 82,
    tags: ['Product', 'Remote'],
    isWomenOnly: false,
    stipend: '$4,000/mo',
    about:
      'Notion is a collaborative workspace that blends note-taking, wikis, and databases. Our fellowship provides hands-on PM training, mentorship from Notion product executives, and the opportunity to build products used by millions worldwide.',
    eligibility:
      'Applicants from any educational background. Ideal candidates have structured problem-solving skills, outstanding communication, and a passion for productivity tools.',
    benefits:
      'Monthly fellowship stipend, direct mentorship from a senior PM mentor, and access to a cohort of international PM fellows.',
    requirements: [
      'Resume submission',
      'Submit a case study analysis answering: "How can Notion improve database onboarding for students?"',
      'Product sense and execution interviews',
    ],
    applicationUrl: 'https://www.notion.so/careers',
    sourceURL: 'https://www.notion.so/careers',
  },
  {
    id: 'opp-microsoft-res',
    title: 'Research Fellowship Program',
    organization: 'Microsoft Research',
    description:
      'Microsoft Research India is looking for Research Fellows. Fellows work on cutting-edge computer science research, collaborating with world-class researchers on projects spanning systems, algorithms, AI, and technology for emerging markets.',
    summary:
      'A 1-to-2 year research fellowship for graduates to collaborate on deep technical problems at Microsoft Research.',
    category: 'FELLOWSHIP',
    deadline: 'August 24, 2026',
    matchScore: 78,
    tags: ['AI Research', 'Python', 'Machine Learning'],
    isWomenOnly: false,
    stipend: 'Competitive Pay',
    about:
      'Microsoft Research India conducts basic and applied research in computer science and software engineering. The Research Fellow (RF) program is designed to expose bright minds to research methodologies, serving as a pathway to top-tier PhD programs.',
    eligibility:
      "Candidates with a Bachelor's or Master's degree in Computer Science or related fields, with strong coding skills in Python, C++, or Java and strong analytical capabilities.",
    benefits:
      'Work side-by-side with Microsoft researchers, publication opportunities at top conferences (NeurIPS, SIGCOMM, CHI), and comprehensive healthcare cover.',
    requirements: [
      'Resume and academic transcripts',
      'Statement of Purpose describing research interests',
      'Three letters of recommendation',
    ],
    applicationUrl: 'https://www.microsoft.com/en-us/research/lab/microsoft-research-india/',
    sourceURL: 'https://www.microsoft.com/en-us/research/lab/microsoft-research-india/',
  },
];

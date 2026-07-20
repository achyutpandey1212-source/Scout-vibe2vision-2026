export interface ATSDetection {
  provider: 'ashby' | 'greenhouse' | 'lever' | 'workable' | 'jobvite' | 'smartrecruiters' | 'none';
  confidence: number;
  parserType: string;
}

export class ATSDetector {
  static detect(url: string): ATSDetection {
    const u = url.toLowerCase();

    if (u.includes('jobs.ashbyhq.com') || u.includes('ashbyhq.com')) {
      return { provider: 'ashby', confidence: 100, parserType: 'ashby' };
    }
    if (u.includes('boards.greenhouse.io') || u.includes('greenhouse.io/')) {
      return { provider: 'greenhouse', confidence: 100, parserType: 'greenhouse' };
    }
    if (u.includes('jobs.lever.co') || u.includes('lever.co/')) {
      return { provider: 'lever', confidence: 100, parserType: 'lever' };
    }
    if (u.includes('workable.com')) {
      return { provider: 'workable', confidence: 100, parserType: 'workable' };
    }
    if (u.includes('jobvite.com')) {
      return { provider: 'jobvite', confidence: 100, parserType: 'jobvite' };
    }
    if (u.includes('smartrecruiters.com')) {
      return { provider: 'smartrecruiters', confidence: 100, parserType: 'smartrecruiters' };
    }

    return { provider: 'none', confidence: 0, parserType: 'none' };
  }
}
export default ATSDetector;

import { IProfile } from '../models/profile.model';

export interface ReadinessResult {
  careerReadinessScore: number;
  completionPercentage: number;
  missingFields: string[];
}

export function calculateCareerReadiness(profile: Partial<IProfile>): ReadinessResult {
  let score = 0;
  const missingFields: string[] = [];

  // 1. Full Name (5 pts)
  if (profile.fullName && profile.fullName.trim() !== '') {
    score += 5;
  } else {
    missingFields.push('Full Name');
  }

  // 2. Gender (5 pts)
  if (profile.gender && profile.gender !== 'UNKNOWN') {
    score += 5;
  } else {
    missingFields.push('Gender');
  }

  // 3. Location: State & City (5 pts)
  if (profile.state && profile.state.trim() !== '' && profile.city && profile.city.trim() !== '') {
    score += 5;
  } else {
    missingFields.push('Location (State/City)');
  }

  // 4. College (5 pts)
  if (profile.college && profile.college.trim() !== '') {
    score += 5;
  } else {
    missingFields.push('College');
  }

  // 5. Degree & Branch (10 pts)
  if (
    profile.degree &&
    profile.degree.trim() !== '' &&
    profile.branch &&
    profile.branch.trim() !== ''
  ) {
    score += 10;
  } else {
    if (!profile.degree || profile.degree.trim() === '') missingFields.push('Degree');
    if (!profile.branch || profile.branch.trim() === '') missingFields.push('Branch');
  }

  // 6. Academic Progress: Current Year & Expected Graduation (10 pts)
  if (profile.currentYear && profile.expectedGraduation) {
    score += 10;
  } else {
    if (!profile.currentYear) missingFields.push('Current Year');
    if (!profile.expectedGraduation) missingFields.push('Expected Graduation');
  }

  // 7. Technical Skills (Max 15 pts, 5 pts per skill up to 3)
  const skillsCount = Array.isArray(profile.technicalSkills) ? profile.technicalSkills.length : 0;
  if (skillsCount >= 3) {
    score += 15;
  } else {
    score += skillsCount * 5;
    missingFields.push('Skills (add at least 3)');
  }

  // 8. Career Goals (10 pts)
  const goalsCount = Array.isArray(profile.careerGoals) ? profile.careerGoals.length : 0;
  if (goalsCount > 0 && profile.careerGoals![0] !== '') {
    score += 10;
  } else {
    missingFields.push('Career Goal');
  }

  // 9. Biggest Challenge (5 pts)
  if (profile.biggestChallenge && profile.biggestChallenge.trim() !== '') {
    score += 5;
  } else {
    missingFields.push('Biggest Challenge');
  }

  // 10. Confidence Signals (10 pts: 3.33 pts per question answered)
  const conf = profile.confidenceProfile || {};
  let confCount = 0;
  if (conf.applyIfNoMeet !== undefined && conf.applyIfNoMeet !== '') confCount++;
  if (conf.avoidCompetitive !== undefined && conf.avoidCompetitive !== '') confCount++;
  if (conf.preferSafer !== undefined && conf.preferSafer !== '') confCount++;

  score += Math.round((confCount / 3) * 10);
  if (confCount < 3) {
    missingFields.push('Confidence Questions');
  }

  // 11. Resume Upload (20 pts)
  if (profile.resumeUploaded) {
    score += 20;
  } else {
    missingFields.push('Resume Upload');
  }

  // Ensure score is bounded between 0 and 100
  score = Math.min(Math.max(score, 0), 100);

  // Completion Percentage: Count of completed fields out of total expected fields
  let completedFields = 0;
  const totalFields = 11;

  if (profile.fullName && profile.fullName.trim() !== '') completedFields++;
  if (profile.gender && profile.gender !== 'UNKNOWN') completedFields++;
  if (profile.state && profile.city) completedFields++;
  if (profile.college && profile.college.trim() !== '') completedFields++;
  if (profile.degree && profile.branch) completedFields++;
  if (profile.currentYear && profile.expectedGraduation) completedFields++;
  if (skillsCount >= 3) completedFields++;
  if (goalsCount > 0 && profile.careerGoals![0] !== '') completedFields++;
  if (profile.biggestChallenge && profile.biggestChallenge.trim() !== '') completedFields++;
  if (confCount === 3) completedFields++;
  if (profile.resumeUploaded) completedFields++;

  const completionPercentage = Math.round((completedFields / totalFields) * 100);

  return {
    careerReadinessScore: score,
    completionPercentage,
    missingFields,
  };
}

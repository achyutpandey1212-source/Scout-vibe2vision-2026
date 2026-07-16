export class ProfileMergeEngine {
  static merge(existingProfile: any, editData: any): any {
    // 1. Identity & Name
    if (editData.fullName && editData.fullName.trim() !== '') {
      existingProfile.fullName = editData.fullName;
    }

    // 2. Education fields
    if (editData.college && editData.college.trim() !== '') {
      existingProfile.college = editData.college;
    }
    if (editData.degree && editData.degree.trim() !== '') {
      existingProfile.degree = editData.degree;
    }
    if (editData.branch && editData.branch.trim() !== '') {
      existingProfile.branch = editData.branch;
    }
    if (editData.expectedGraduation !== undefined && editData.expectedGraduation !== null) {
      existingProfile.expectedGraduation = Number(editData.expectedGraduation);
    }
    if (editData.currentYear !== undefined && editData.currentYear !== null) {
      existingProfile.currentYear = Number(editData.currentYear);
    }

    // 3. Technical Skills: Deduplicate skill IDs
    const existingSkills = new Set<string>(existingProfile.technicalSkills || []);
    if (Array.isArray(editData.technicalSkills)) {
      editData.technicalSkills.forEach((s: string) => {
        if (s && s.trim() !== '') {
          existingSkills.add(s.toLowerCase());
        }
      });
    }
    existingProfile.technicalSkills = Array.from(existingSkills);

    // 4. Update Profile connection flags based on detected contact links
    if (Array.isArray(editData.detectedLinks)) {
      editData.detectedLinks.forEach((link: { label: string; url: string }) => {
        if (/github\.com/i.test(link.url)) {
          existingProfile.githubConnected = true;
        } else if (/linkedin\.com/i.test(link.url)) {
          existingProfile.linkedinConnected = true;
        } else if (link.url.trim() !== '') {
          existingProfile.portfolioConnected = true;
        }
      });
    }

    return existingProfile;
  }
}

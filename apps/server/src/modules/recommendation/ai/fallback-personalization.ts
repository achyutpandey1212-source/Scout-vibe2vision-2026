import { CandidateSnapshotBuilder } from '../../../recommendation/engine/candidate-snapshot';
import { ResumeContextBuilder } from '../../../recommendation/engine/resume-context-builder';
import { IAIPersonalizationResponse, IAIPersonalizationItem } from './ai.types';

export class FallbackPersonalization {
  /**
   * Generates a smart, deterministic fallback personalization response
   * derived from CandidateSnapshot and ResumeContext without calling an LLM.
   */
  static generate(
    topCandidates: any[],
    profile?: any,
    resume?: any,
    existingSnapshot?: any,
  ): IAIPersonalizationResponse {
    const snapshot =
      existingSnapshot || new CandidateSnapshotBuilder().build(profile || {}, resume || null);
    const resumeContextBuilder = new ResumeContextBuilder();
    const resumeContext = resumeContextBuilder.build(snapshot);

    const slotNames = ['perfectMatch', 'hiddenGem', 'fastApply', 'resumeBuilder', 'stretchGoal'];
    const recommendationsBySlot: Record<string, IAIPersonalizationItem> = {};

    const primaryProj = resumeContext.topProjects[0] || {
      title: 'Software Project',
      technologies: snapshot.strongestTechnologies.slice(0, 3),
      summary: 'Demonstrated software development experience',
    };

    topCandidates.slice(0, 5).forEach((cand, idx) => {
      const slot = slotNames[idx] || `match_${idx}`;
      const opp = cand.opportunity || cand;
      const oppTitle = opp.title || 'Software Engineering Opportunity';
      const org = opp.organization || opp.company || 'the hiring company';

      // Identify best matched project for this candidate item
      const matchedProjName =
        (cand.matchedProjects && cand.matchedProjects[0]) || primaryProj.title;
      const projObj =
        resumeContext.topProjects.find((p) => p.title === matchedProjName) || primaryProj;

      const techList =
        projObj.technologies.length > 0
          ? projObj.technologies.slice(0, 3).join(', ')
          : 'Node.js and web technologies';

      const projectEvidence = `Your ${projObj.title} project demonstrates experience with ${techList}. Those are directly relevant to this ${oppTitle} role at ${org}.`;

      const whyYou = `You have already built ${projObj.title} using ${techList}, showing practical engineering capability beyond coursework.`;
      const whyCompany = `This role at ${org} offers hands-on exposure to production engineering workflows.`;

      const oppSkills = (opp.skills || opp.requiredSkills || []).map((s: string) =>
        s.toLowerCase(),
      );
      const candSkills = snapshot.technologies;
      const missingSkills = oppSkills.filter((s: string) => !candSkills.includes(s)).slice(0, 3);
      if (missingSkills.length === 0) {
        missingSkills.push('CI/CD Pipelines', 'Automated Testing');
      }

      const firstAction = `Spend 30 minutes updating your ${projObj.title} repository README to highlight backend architecture before submitting your application to ${org}.`;

      const personalizedReason = `${whyYou} ${whyCompany} Key area to refine: ${missingSkills[0]}. First Step: ${firstAction}`;

      recommendationsBySlot[slot] = {
        personalizedReason,
        projectEvidence,
        whyYou,
        whyCompany,
        whyNow: 'Applications are currently open for active review.',
        missingSkills,
        firstAction,
        confidenceMessage: `Strong match based on your ${projObj.title} project and ${snapshot.strongestTechnologies.slice(0, 2).join(', ')} experience.`,
      };
    });

    const projectNamesStr = resumeContext.topProjects.map((p) => p.title).join(', ');
    const aiSummary = `Based on your profile, your strongest competitive advantage isn't coursework—it's the projects you've already built${projectNamesStr ? ` (${projectNamesStr})` : ''}. They demonstrate practical software construction using ${snapshot.strongestTechnologies.slice(0, 4).join(', ')}. This week's recommendations prioritize roles where hands-on project proof matters most. Your main focus now is communicating your system architecture decisions clearly during applications.`;

    return {
      todayMission: `Review today's personalized recommendations and update your project READMEs for target roles.`,
      aiSummary,
      recommendationsBySlot,
    };
  }
}

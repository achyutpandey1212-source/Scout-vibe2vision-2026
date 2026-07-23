import { CandidateSnapshotBuilder } from '../../../recommendation/engine/candidate-snapshot';
import { ResumeContextBuilder } from '../../../recommendation/engine/resume-context-builder';
import { IAIPersonalizationResponse, IAIPersonalizationItem } from './ai.types';

export class FallbackPersonalization {
  /**
   * Generates a complete, deterministic Career Report fallback for every slot.
   * Produces the same field structure as the LLM, grounded in the candidate's
   * actual snapshot data. No LLM call is made.
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

    const topTech =
      snapshot.strongestTechnologies.slice(0, 4).join(', ') || 'software technologies';
    const top2Tech =
      snapshot.strongestTechnologies.slice(0, 2).join(' and ') || 'core technologies';

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

      // ── Compute missing skills ────────────────────────────────────────────
      const oppSkills = (opp.skills || opp.requiredSkills || []).map((s: string) =>
        s.toLowerCase(),
      );
      const candSkills = snapshot.technologies;
      const missingSkills = oppSkills.filter((s: string) => !candSkills.includes(s)).slice(0, 3);
      if (missingSkills.length === 0) {
        missingSkills.push('CI/CD Pipelines', 'Automated Testing');
      }

      // ── Build all Career Report fields deterministically ──────────────────
      const executiveSummary =
        `${org} is seeking a ${oppTitle}. Your ${projObj.title} project demonstrates direct ` +
        `experience with ${techList}, placing you in a strong position for this role. ` +
        `Scout selected this opportunity based on technical skill overlap and career trajectory alignment.`;

      const whyScoutPickedThis =
        `Your ${projObj.title} project showcases hands-on experience with ${techList}. ` +
        `These are the exact technologies and problem-solving patterns ${org} is looking for. ` +
        `Combined with your background in ${top2Tech}, this opportunity aligns well with your ` +
        `current skill set and the career direction you are pursuing.`;

      const projectEvidence =
        `Your ${projObj.title} project demonstrates experience with ${techList}. ` +
        `Those are directly relevant to this ${oppTitle} role at ${org}.`;

      const whyYou =
        `You have already built ${projObj.title} using ${techList}, showing practical ` +
        `engineering capability beyond coursework.`;

      const whyCompany =
        `This role at ${org} offers hands-on exposure to production engineering workflows ` +
        `and real-world problem-solving that will strengthen your portfolio.`;

      const strongestStrengths = [
        `Demonstrated project experience through ${projObj.title} using ${techList}`,
        `Hands-on familiarity with ${top2Tech}`,
        `Practical software construction capability evidenced through completed projects`,
        `Strong foundational background aligned with ${oppTitle} requirements`,
      ];

      const resumeImprovements = [
        `Update the README of your ${projObj.title} repository to clearly describe the architecture and your technical decisions`,
        `Add measurable impact metrics to each project description (e.g., reduced load time by 30%)`,
        `Ensure your GitHub profile is public and project repositories are well-documented`,
      ];

      const interviewPrep = [
        `Be ready to walk through the architecture of ${projObj.title} and explain your technical trade-offs`,
        `Prepare a 2-minute explanation of how you approached a challenging problem in your projects`,
        `Review core concepts in ${techList} — expect practical questions on implementation details`,
      ];

      const applicationConfidence = {
        level: 'Competitive' as string,
        explanation:
          `Your ${projObj.title} project and ${top2Tech} experience demonstrate strong alignment ` +
          `with the core requirements for this ${oppTitle} role.`,
      };

      const nextAction =
        `Spend 30 minutes updating your ${projObj.title} README to highlight backend ` +
        `architecture before submitting your application to ${org}.`;

      const firstAction = nextAction;

      const personalizedReason = `${whyYou} ${whyCompany} Key area to refine: ${missingSkills[0]}. First Step: ${firstAction}`;

      const scoutVerdict = {
        verdict: 'Apply Immediately' as string,
        explanation:
          `Your technical background covers the core requirements for this role. ` +
          `The primary gap is in ${missingSkills[0]}, which can be addressed with focused ` +
          `preparation. Apply within the next 48 hours to ensure your application is reviewed.`,
      };

      const applicationStrategy =
        `Lead with your ${projObj.title} project when describing your experience — it is your ` +
        `strongest evidence of practical engineering. Emphasize the ${techList} stack, your ` +
        `architecture decisions, and any measurable outcomes. Tailor your resume summary to ` +
        `directly reference ${oppTitle} responsibilities.`;

      const preparationChecklist = [
        `Review the ${org} website and understand their product or service`,
        `Update your ${projObj.title} repository README with clear architecture documentation`,
        `Prepare a concise walkthrough of your strongest project (under 3 minutes)`,
        `Review fundamentals in ${missingSkills[0]} — 1–2 hours of focused reading`,
        `Ensure your application URL, LinkedIn, and GitHub links are all current`,
        `Tailor your resume summary to reference the ${oppTitle} role specifically`,
      ];

      const strengths = strongestStrengths;
      const challenges = missingSkills.map(
        (skill: string) =>
          `${skill} experience is preferred — your existing ${top2Tech} background makes this a bridgeable gap`,
      );

      recommendationsBySlot[slot] = {
        // Legacy fields
        personalizedReason,
        projectEvidence,
        whyYou,
        whyCompany,
        whyNow: 'Applications are currently open for active review.',
        missingSkills,
        firstAction,
        confidenceMessage: `Strong match based on your ${projObj.title} project and ${top2Tech} experience.`,

        // Full Career Report fields
        executiveSummary,
        whyScoutPickedThis,
        strongestStrengths,
        resumeImprovements,
        interviewPrep,
        applicationConfidence,
        nextAction,
        scoutVerdict,
        strengths,
        challenges,
        applicationStrategy,
        preparationChecklist,
      };
    });

    const projectNamesStr = resumeContext.topProjects.map((p) => p.title).join(', ');
    const aiSummary =
      `Your strongest competitive advantage is not your coursework — it is the projects you have ` +
      `already shipped${projectNamesStr ? ` (${projectNamesStr})` : ''}. They demonstrate ` +
      `practical software construction using ${topTech}. Today's recommendations prioritize ` +
      `roles where hands-on project proof matters most. Focus on communicating your architecture ` +
      `decisions clearly in every application.`;

    return {
      todayMission: `Apply to today's top match and spend 30 minutes sharpening your project READMEs.`,
      aiSummary,
      recommendationsBySlot,
    };
  }
}

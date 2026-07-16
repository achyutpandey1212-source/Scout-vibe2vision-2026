import fs from 'fs';
import path from 'path';
import { DocumentExtractor } from './document-extractor';
import { ResumeSectionParser } from './resume-section-parser';
import { SkillNormalizer } from './skill-normalizer';

async function run() {
  const resumesDir = 'c:/Users/Achyut/Desktop/vibe2vision/test-data/resumes';

  if (!fs.existsSync(resumesDir)) {
    console.error('Directory does not exist:', resumesDir);
    return;
  }

  const findPdfs = (dir: string): string[] => {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(findPdfs(fullPath));
      } else if (file.endsWith('.pdf')) {
        results.push(fullPath);
      }
    });
    return results;
  };

  const pdfPaths = findPdfs(resumesDir);
  console.log(`Found ${pdfPaths.length} PDF resumes for regression testing.`);

  let passedCount = 0;
  const reportLines: string[] = [];
  reportLines.push('# Resume Intelligence Parser Regression Report\n');

  for (const pdfPath of pdfPaths) {
    const relativePath = path.relative(resumesDir, pdfPath).replace(/\\/g, '/');
    const buffer = fs.readFileSync(pdfPath);

    console.log(`\nParsing: ${relativePath}...`);
    try {
      const extracted = await DocumentExtractor.extract({
        originalName: path.basename(pdfPath),
        mimeType: 'application/pdf',
        size: buffer.length,
        uploadedAt: new Date(),
        buffer,
      });

      const parsed = ResumeSectionParser.parse(extracted.rawText);

      // Perform validation checks
      const hasCollege = !!parsed.detectedCollege;
      const hasProjects = parsed.detectedProjects.length > 0;
      const hasSkills = parsed.skillsText.trim().length > 0;
      const hasExperience = parsed.detectedExperience.length > 0;

      // Check duplicates
      const skillIds = new Set<string>();
      let duplicateSkills = false;
      const normalizedSkills = SkillNormalizer.normalize(parsed.skillsText);
      for (const skill of normalizedSkills) {
        if (skillIds.has(skill)) {
          duplicateSkills = true;
        }
        skillIds.add(skill);
      }

      const projectTitles = new Set<string>();
      let duplicateProjects = false;
      let invalidProjectTitles = false;
      const noiseWords = [
        'github',
        'live',
        'tech',
        'built',
        'designed',
        'integrated',
        'architected',
      ];

      for (const p of parsed.detectedProjects) {
        const titleLower = p.title.toLowerCase().trim();
        if (projectTitles.has(titleLower)) {
          duplicateProjects = true;
        }
        projectTitles.add(titleLower);

        if (
          noiseWords.some(
            (w) =>
              titleLower === w || titleLower.startsWith(w + ' ') || titleLower.startsWith(w + ':'),
          )
        ) {
          invalidProjectTitles = true;
        }
      }

      const isStable = parsed.overallConfidence >= 0.25;

      const passed = !duplicateSkills && !duplicateProjects && !invalidProjectTitles && isStable;
      if (passed) passedCount++;

      // Log results to console
      console.log(`✓ Overall Confidence: ${parsed.overallConfidence}`);
      console.log(
        `  Layouts: Proj:${parsed.layoutDetected.projectLayout}, Exp:${parsed.layoutDetected.experienceLayout}, Edu:${parsed.layoutDetected.educationLayout}`,
      );
      console.log(
        `  Projects: ${parsed.detectedProjects.length}, Experience: ${parsed.detectedExperience.length}, Skills: ${normalizedSkills.length}`,
      );

      // Add to markdown report
      reportLines.push(`## Resume: ${relativePath}\n`);
      reportLines.push(
        `- **Layout Profile**: Project: \`${parsed.layoutDetected.projectLayout}\`, Exp: \`${parsed.layoutDetected.experienceLayout}\`, Edu: \`${parsed.layoutDetected.educationLayout}\``,
      );
      reportLines.push(`- **Overall Confidence**: ${parsed.overallConfidence}`);
      reportLines.push(`- **Validation Status**: ${passed ? '✅ PASSED' : '❌ FAILED'}`);

      reportLines.push(`- **Extracted Checklist**:`);
      reportLines.push(
        `  - ${hasCollege ? '✓' : '✗'} Education (College: ${parsed.detectedCollege || 'None'}, Degree: ${
          parsed.detectedDegree || 'None'
        }, Branch: ${parsed.detectedFieldOfStudy || 'None'})`,
      );
      reportLines.push(
        `  - ${hasExperience ? '✓' : '✗'} Experience (${parsed.detectedExperience.length} items detected)`,
      );
      reportLines.push(
        `  - ${hasProjects ? '✓' : '✗'} Projects (${parsed.detectedProjects.length} items detected)`,
      );
      reportLines.push(
        `  - ${hasSkills ? '✓' : '✗'} Skills (${normalizedSkills.length} skills normalized)`,
      );

      const warnings: string[] = [...parsed.warnings];
      if (duplicateSkills) warnings.push('Duplicate skills detected');
      if (duplicateProjects) warnings.push('Duplicate project titles detected');
      if (invalidProjectTitles) warnings.push('Invalid project titles found (noise keywords)');

      if (warnings.length > 0) {
        reportLines.push(`- **Warnings / Feedback**:`);
        warnings.forEach((w) => reportLines.push(`  - ⚠️ ${w}`));
      }
      reportLines.push('\n---\n');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ Crash on ${relativePath}:`, message);
      reportLines.push(`## Resume: ${relativePath}\n`);
      reportLines.push(`- **Validation Status**: 💥 CRASHED`);
      reportLines.push(`- **Error**: \`${message}\``);
      reportLines.push('\n---\n');
    }
  }

  const summary = `\nSummary: ${passedCount} / ${pdfPaths.length} resumes successfully verified.\n`;
  console.log(summary);
  reportLines.push(`## Regression Summary\n`);
  reportLines.push(`- **Total Resumes tested**: ${pdfPaths.length}`);
  reportLines.push(`- **Passed/Stable count**: ${passedCount}`);
  reportLines.push(`- **Success Rate**: ${((passedCount / pdfPaths.length) * 100).toFixed(1)}%`);

  const reportDir =
    'C:/Users/Achyut/.gemini/antigravity/brain/98914601-c59f-4c56-a0ae-0bd0fd505d55';
  fs.writeFileSync(path.join(reportDir, 'regression_report.md'), reportLines.join('\n'));
  console.log(
    `Regression report written successfully to ${path.join(reportDir, 'regression_report.md')}`,
  );
}

run();

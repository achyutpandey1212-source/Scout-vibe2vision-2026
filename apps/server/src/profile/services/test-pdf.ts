import fs from 'fs';
import { DocumentExtractor } from './document-extractor';

(async () => {
  try {
    const pdfPath = 'c:/Users/Achyut/Desktop/vibe2vision/docs/achyut_resume (2).pdf';
    const buffer = fs.readFileSync(pdfPath);
    const result = await DocumentExtractor.extract({
      originalName: 'achyut_resume (2).pdf',
      mimeType: 'application/pdf',
      size: buffer.length,
      uploadedAt: new Date(),
      buffer,
    });

    console.log('Extracted text length:', result.rawText.length);
    fs.writeFileSync(
      'c:/Users/Achyut/Desktop/vibe2vision/docs/extracted_resume_text.txt',
      result.rawText,
    );
    console.log('Extracted text written successfully to docs/extracted_resume_text.txt');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error extracting:', message, err instanceof Error ? err.stack : undefined);
  }
})();

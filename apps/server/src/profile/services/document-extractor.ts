import pdfParse from 'pdf-parse';

export interface ExtractorFile {
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  buffer: Buffer;
}

export interface ExtractionResult {
  rawText: string;
  metadata: Record<string, unknown>;
}

export class DocumentExtractor {
  static async extract(file: ExtractorFile): Promise<ExtractionResult> {
    try {
      const parsed = await pdfParse(file.buffer);
      const rawText = typeof parsed.text === 'string' ? parsed.text : '';

      return {
        rawText: rawText || '',
        metadata: {
          numPages: parsed.numpages || 0,
          originalName: file.originalName,
          mimeType: file.mimeType,
          size: file.size,
          uploadedAt: file.uploadedAt,
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[DocumentExtractor] Error extracting text from PDF:', error);
      throw new Error(`PDF text extraction failed: ${message}`);
    }
  }
}

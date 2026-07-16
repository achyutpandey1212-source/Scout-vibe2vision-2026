import { PDFParse } from 'pdf-parse';

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
      const parser = new PDFParse({ data: file.buffer });
      const textResult = await parser.getText();
      const rawText = textResult.text || '';

      const numPages = textResult.pages?.length || 0;

      return {
        rawText: rawText || '',
        metadata: {
          numPages,
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

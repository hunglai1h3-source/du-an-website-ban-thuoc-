export type DocumentType = "IMAGE" | "PDF";

export interface ProcessedPage {
  pageNumber: number;
  buffer: Buffer;
  mimeType: string;
  isTextLayer?: boolean;
  extractedText?: string;
}

export interface ProcessedDocument {
  type: DocumentType;
  pageCount: number;
  pages: ProcessedPage[];
}

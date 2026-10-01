import { RawAiExtractionOutput } from "./extraction-types";

export interface PrescriptionExtractionInput {
  prescriptionId: string;
  rawOcrText: string;
  pages?: {
    pageNumber: number;
    text: string;
  }[];
}

export interface PrescriptionExtractionOutput {
  provider: string;
  model: string;
  data: RawAiExtractionOutput;
  processingTimeMs: number;
}

export interface PrescriptionExtractionProvider {
  readonly name: string;
  extract(input: PrescriptionExtractionInput): Promise<PrescriptionExtractionOutput>;
}

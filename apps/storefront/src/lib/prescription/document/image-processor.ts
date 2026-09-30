import { ProcessedDocument } from "./document-types";
import { CorruptDocumentError } from "../ocr/ocr-errors";

/**
 * ImageProcessor
 * Tiền xử lý ảnh đơn thuốc y khoa (JPEG, PNG):
 * - Bảo toàn tính toàn vẹn 100% của tệp gốc (Immutability).
 * - Kiểm tra tính hợp lệ của dữ liệu nhị phân.
 * - Chuẩn hóa thông số đầu vào cho OCR engine.
 */
export class ImageProcessor {
  public async processImage(
    buffer: Buffer,
    mimeType: string
  ): Promise<ProcessedDocument> {
    if (!buffer || buffer.length < 4) {
      throw new CorruptDocumentError("Dữ liệu hình ảnh đơn thuốc bị rỗng hoặc không hợp lệ.");
    }

    // Kiểm tra tính hợp lệ cơ bản của ảnh JPEG hoặc PNG
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47;

    if (!isJpeg && !isPng) {
      throw new CorruptDocumentError("Định dạng dữ liệu nhị phân của ảnh không hợp lệ.");
    }

    return {
      type: "IMAGE",
      pageCount: 1,
      pages: [
        {
          pageNumber: 1,
          buffer,
          mimeType,
          isTextLayer: false,
        },
      ],
    };
  }
}

export const imageProcessor = new ImageProcessor();

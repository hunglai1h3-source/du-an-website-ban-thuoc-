import { PDFParse } from "pdf-parse";
import { ProcessedDocument, ProcessedPage } from "./document-types";
import { DocumentTooLargeError, CorruptDocumentError } from "../ocr/ocr-errors";
import { MAX_PDF_PAGES } from "../ocr/ocr-types";

/**
 * PdfProcessor
 * Xử lý tài liệu đơn thuốc điện tử dạng PDF:
 * - Đếm số trang chính xác.
 * - Kiểm soát giới hạn trang chống DoS (tối đa 10 trang).
 * - Bóc tách text layer nếu là PDF điện tử chuẩn từ cơ sở y tế.
 * - Phát hiện và xử lý lỗi PDF corrupt / mã hóa an toàn.
 */
export class PdfProcessor {
  public async processPdf(buffer: Buffer): Promise<ProcessedDocument> {
    if (!buffer || buffer.length < 4) {
      throw new CorruptDocumentError("Dữ liệu tệp PDF bị rỗng hoặc không hợp lệ.");
    }

    // Kiểm tra Magic Bytes chuẩn của PDF (%PDF -> 0x25, 0x50, 0x44, 0x46)
    if (
      buffer[0] !== 0x25 ||
      buffer[1] !== 0x50 ||
      buffer[2] !== 0x44 ||
      buffer[3] !== 0x46
    ) {
      throw new CorruptDocumentError("Dữ liệu tệp không chứa cấu trúc chữ ký nhị phân %PDF hợp lệ.");
    }

    let parser: InstanceType<typeof PDFParse> | null = null;
    try {
      parser = new PDFParse({ data: buffer });
      const info = await parser.getInfo();
      const pageCount = info.total || 1;

      // Giới hạn trang chống lạm dụng tài nguyên
      if (pageCount > MAX_PDF_PAGES) {
        throw new DocumentTooLargeError(
          `Tài liệu PDF có ${pageCount} trang, vượt quá giới hạn cho phép tối đa là ${MAX_PDF_PAGES} trang/đơn thuốc.`
        );
      }

      const textResult = await parser.getText();
      const pages: ProcessedPage[] = [];

      for (let i = 1; i <= pageCount; i++) {
        const pageItem = textResult.pages.find((p) => p.num === i);
        const textForPage = pageItem?.text ? pageItem.text.trim() : "";

        pages.push({
          pageNumber: i,
          buffer,
          mimeType: "application/pdf",
          isTextLayer: textForPage.length > 0,
          extractedText: textForPage,
        });
      }

      return {
        type: "PDF",
        pageCount,
        pages,
      };
    } catch (error: any) {
      if (error instanceof DocumentTooLargeError) {
        throw error;
      }
      console.error("[PdfProcessor Error] Không thể đọc tài liệu PDF:", error);
      throw new CorruptDocumentError(
        "Tài liệu PDF bị lỗi cấu trúc hoặc được bảo vệ bằng mật khẩu, không thể xử lý bóc tách."
      );
    } finally {
      if (parser) {
        try {
          await parser.destroy();
        } catch {
          // Bỏ qua lỗi hủy parser nếu đã giải phóng
        }
      }
    }
  }
}

export const pdfProcessor = new PdfProcessor();

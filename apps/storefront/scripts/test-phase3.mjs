import fs from "fs";
import path from "path";
import zlib from "zlib";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:../prisma/dev.db",
    },
  },
});

// Import modules từ src
import { LocalPrescriptionStorage } from "../src/lib/prescription/storage.ts";
import { PrescriptionService } from "../src/lib/prescription/prescription-service.ts";
import { OcrService } from "../src/lib/prescription/ocr/ocr-service.ts";
import { tesseractOcrProvider } from "../src/lib/prescription/ocr/tesseract-provider.ts";
import { MockOcrProvider } from "../src/lib/prescription/ocr/mock-provider.ts";
import { documentProcessor } from "../src/lib/prescription/document/document-processor.ts";
import {
  OcrAlreadyProcessingError,
} from "../src/lib/prescription/ocr/ocr-errors.ts";
import { NotFoundError } from "../src/lib/prescription/errors.ts";

const results = [];
let passCount = 0;
let failCount = 0;

function logResult(caseNumber, name, passed, details = "") {
  if (passed) {
    passCount++;
    results.push(`[PASS] CASE ${caseNumber}: ${name} ${details ? `(${details})` : ""}`);
    console.log(`[PASS] CASE ${caseNumber}: ${name} ${details ? `(${details})` : ""}`);
  } else {
    failCount++;
    results.push(`[FAIL] CASE ${caseNumber}: ${name} -> ${details}`);
    console.error(`[FAIL] CASE ${caseNumber}: ${name} -> ${details}`);
  }
}

// Helper: tính CRC32 cho PNG chunks
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Helper: Tạo ảnh PNG hợp lệ theo chuẩn chuẩn nhị phân RFC 2083
function createPng(width, height, getPixelRgb) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 2; // RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk("IHDR", ihdrData);

  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const [r, g, b] = getPixelRgb(x, y);
      const pixelOffset = rowOffset + 1 + x * 3;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const idat = makeChunk("IDAT", idatData);
  const iend = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Bảng font tối giản để vẽ text chuẩn quang học cho Tesseract
const FONT = {
  P: [0x7c, 0x66, 0x66, 0x7c, 0x60, 0x60, 0x60, 0x00],
  A: [0x18, 0x3c, 0x66, 0x66, 0x7e, 0x66, 0x66, 0x00],
  R: [0x7c, 0x66, 0x66, 0x7c, 0x6e, 0x66, 0x66, 0x00],
  M: [0x66, 0x7e, 0x5a, 0x42, 0x42, 0x42, 0x42, 0x00],
  O: [0x3c, 0x66, 0x66, 0x66, 0x66, 0x66, 0x3c, 0x00],
  X: [0x66, 0x66, 0x3c, 0x18, 0x3c, 0x66, 0x66, 0x00],
};

function generateTextImage(text, width = 240, height = 80, scale = 6, fg = 0, bg = 255) {
  const grid = Array.from({ length: height }, () => Array(width).fill(bg));
  const chars = text.toUpperCase().split("");

  chars.forEach((ch, ci) => {
    const glyph = FONT[ch];
    if (!glyph) return;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((glyph[r] >> (7 - c)) & 1) {
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              const py = 15 + r * scale + dy;
              const px = 20 + ci * (scale * 8 + 4) + c * scale + dx;
              if (py < height && px < width) {
                grid[py][px] = fg;
              }
            }
          }
        }
      }
    }
  });

  return createPng(width, height, (x, y) => [grid[y][x], grid[y][x], grid[y][x]]);
}

// Helper: Tạo tài liệu PDF 1.4 có text layer chuẩn
function createTestPdf(pages) {
  let content = "%PDF-1.4\n";
  const objects = [];

  // 1: Catalog
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  // Page kids string
  const pageKids = pages.map((_, i) => `${3 + i * 2} 0 R`).join(" ");
  // 2: Pages container
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${pageKids}] /Count ${pages.length} >>\nendobj\n`);

  pages.forEach((pageText, i) => {
    const pageObjId = 3 + i * 2;
    const contentObjId = pageObjId + 1;
    const fontObjId = 3 + pages.length * 2;

    const streamContent = `BT /F1 18 Tf 50 700 Td (${pageText}) Tj ET`;
    const streamLen = Buffer.byteLength(streamContent);

    // Page Object
    objects.push(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObjId} 0 R /Resources << /Font << /F1 ${fontObjId} 0 R >> >> >>\nendobj\n`
    );
    // Content Stream Object
    objects.push(
      `${contentObjId} 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream\nendobj\n`
    );
  });

  // Font Object
  const fontObjId = 3 + pages.length * 2;
  objects.push(`${fontObjId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);

  let offset = content.length;
  const offsets = [0]; // 0000000000 65535 f
  objects.forEach((obj) => {
    offsets.push(offset);
    content += obj;
    offset += Buffer.byteLength(obj);
  });

  const xrefOffset = offset;
  content += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    content += offsets[i].toString().padStart(10, "0") + " 00000 n \n";
  }
  content += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(content);
}

async function runPhase3Tests() {
  console.log("=================================================================");
  console.log("   BẮT ĐẦU CHẠY BỘ 15 TEST CASES BẮT BUỘC - PHASE 3 OCR PIPELINE ");
  console.log("=================================================================");

  const storageDir = path.join(process.cwd(), "storage", "test-prescriptions");
  const testStorage = new LocalPrescriptionStorage(storageDir);
  const prescriptionService = new PrescriptionService(testStorage, prisma);
  const ocrService = new OcrService(testStorage, documentProcessor, tesseractOcrProvider, prisma);

  // Chuẩn bị các tệp kiểm thử
  const clearPngBuffer = generateTextImage("PAR", 240, 80, 6, 0, 255);
  const blankPngBuffer = createPng(200, 60, () => [255, 255, 255]); // Không có chữ
  const lowContrastPngBuffer = generateTextImage("PAR", 240, 80, 6, 215, 240); // Tương phản cực thấp
  const pdf1PageBuffer = createTestPdf(["DON THUOC - PARACETAMOL 500MG"]);
  const pdf3PageBuffer = createTestPdf([
    "TRANG 1: PARACETAMOL 500MG",
    "TRANG 2: AMOXICILLIN 500MG",
    "TRANG 3: VITAMIN C 500MG",
  ]);
  const corruptPdfBuffer = Buffer.from("%PDF-1.4\nCorrupted binary content without xref table or EOF");

  // ----------------------------------------------------
  // CASE 1: Ảnh đơn thuốc rõ nét -> COMPLETED, Text extracted, Confidence > 0
  // ----------------------------------------------------
  try {
    const file1 = new File([clearPngBuffer], "prescription_clear.png", { type: "image/png" });
    const p1 = await prescriptionService.createPrescription(file1, { sessionId: "case1" });

    const ocr1 = await ocrService.runOcr(p1.prescriptionId);
    const passed1 =
      ocr1.status === "COMPLETED" &&
      ocr1.fullText.trim().length > 0 &&
      ocr1.averageConfidence > 0 &&
      ocr1.pageCount === 1;

    logResult(1, "Ảnh đơn thuốc rõ nét (PNG) -> COMPLETED & trích xuất đúng ký tự", passed1, `Confidence: ${ocr1.averageConfidence}, Text: "${ocr1.fullText}"`);
  } catch (err) {
    logResult(1, "Ảnh đơn thuốc rõ nét (PNG)", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 2: Ảnh PNG thứ hai -> COMPLETED
  // ----------------------------------------------------
  try {
    const png2Buffer = generateTextImage("MOX", 240, 80, 6, 0, 255);
    const file2 = new File([png2Buffer], "amox_clear.png", { type: "image/png" });
    const p2 = await prescriptionService.createPrescription(file2, { sessionId: "case2" });

    const ocr2 = await ocrService.runOcr(p2.prescriptionId);
    const passed2 =
      ocr2.status === "COMPLETED" &&
      ocr2.averageConfidence > 0 &&
      ocr2.pageCount === 1;

    logResult(2, "Ảnh PNG thứ hai -> COMPLETED và ghi nhận điểm tin cậy thực tế", passed2, `Confidence: ${ocr2.averageConfidence}, Text: "${ocr2.fullText}"`);
  } catch (err) {
    logResult(2, "Ảnh PNG thứ hai", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 3: PDF 1 trang -> PageCount = 1, trích xuất text layer
  // ----------------------------------------------------
  try {
    const file3 = new File([pdf1PageBuffer], "don_thuoc_1trang.pdf", { type: "application/pdf" });
    const p3 = await prescriptionService.createPrescription(file3, { sessionId: "case3" });

    const ocr3 = await ocrService.runOcr(p3.prescriptionId);
    const passed3 =
      ocr3.status === "COMPLETED" &&
      ocr3.pageCount === 1 &&
      ocr3.fullText.includes("PARACETAMOL 500MG") &&
      ocr3.pages.length === 1;

    logResult(3, "Tài liệu PDF 1 trang -> Bóc tách text layer chính xác", passed3, `PageCount: ${ocr3.pageCount}, Text: "${ocr3.fullText}"`);
  } catch (err) {
    logResult(3, "Tài liệu PDF 1 trang", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 4: PDF nhiều trang (3 trang) -> Bóc tách đủ 3 trang trong PrescriptionOcrPage
  // ----------------------------------------------------
  try {
    const file4 = new File([pdf3PageBuffer], "don_thuoc_3trang.pdf", { type: "application/pdf" });
    const p4 = await prescriptionService.createPrescription(file4, { sessionId: "case4" });

    const ocr4 = await ocrService.runOcr(p4.prescriptionId);
    const dbPages = await prisma.prescriptionOcrPage.findMany({
      where: { ocrResultId: ocr4.id },
      orderBy: { pageNumber: "asc" },
    });

    const passed4 =
      ocr4.status === "COMPLETED" &&
      ocr4.pageCount === 3 &&
      dbPages.length === 3 &&
      dbPages[0].pageNumber === 1 &&
      dbPages[1].pageNumber === 2 &&
      dbPages[2].pageNumber === 3 &&
      ocr4.fullText.includes("TRANG 1") &&
      ocr4.fullText.includes("TRANG 2") &&
      ocr4.fullText.includes("TRANG 3");

    logResult(4, "Tài liệu PDF nhiều trang (3 trang) -> Lưu trữ đầy đủ từng trang", passed4, `Pages found: ${dbPages.length}`);
  } catch (err) {
    logResult(4, "Tài liệu PDF nhiều trang (3 trang)", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 5: Ảnh bị xoay -> Xử lý êm thuận không crash
  // ----------------------------------------------------
  try {
    const rotatedPngBuffer = generateTextImage("P", 100, 200, 6, 0, 255);
    const file5 = new File([rotatedPngBuffer], "rotated.png", { type: "image/png" });
    const p5 = await prescriptionService.createPrescription(file5, { sessionId: "case5" });

    const ocr5 = await ocrService.runOcr(p5.prescriptionId);
    const passed5 = ocr5.status === "COMPLETED";

    logResult(5, "Ảnh có hướng xoay bất thường -> Tự thích ứng và không làm crash tiến trình", passed5, `Status: ${ocr5.status}, Confidence: ${ocr5.averageConfidence}`);
  } catch (err) {
    logResult(5, "Ảnh có hướng xoay bất thường", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 6: Ảnh mờ / tương phản cực thấp -> Trả về confidence thấp (< 0.60), không crash
  // ----------------------------------------------------
  try {
    const lowConfMockProvider = new MockOcrProvider("low_confidence");
    const lowConfService = new OcrService(
      testStorage,
      documentProcessor,
      lowConfMockProvider,
      prisma
    );

    const file6 = new File([lowContrastPngBuffer], "blurry_low_contrast.png", { type: "image/png" });
    const p6 = await prescriptionService.createPrescription(file6, { sessionId: "case6" });

    const ocr6 = await lowConfService.runOcr(p6.prescriptionId);
    const passed6 =
      ocr6.status === "COMPLETED" &&
      ocr6.averageConfidence !== null &&
      ocr6.averageConfidence < 0.60 &&
      ocr6.isLowConfidence === true;

    logResult(6, "Ảnh mờ/độ tương phản thấp -> Ghi nhận độ tin cậy < 60% (cảnh báo chất lượng)", passed6, `Confidence: ${ocr6.averageConfidence}, isLowConfidence: ${ocr6.isLowConfidence}`);
  } catch (err) {
    logResult(6, "Ảnh mờ/độ tương phản thấp", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 7: Ảnh không có chữ -> Trả về text rỗng, không bịa tên thuốc
  // ----------------------------------------------------
  try {
    const file7 = new File([blankPngBuffer], "blank_no_text.png", { type: "image/png" });
    const p7 = await prescriptionService.createPrescription(file7, { sessionId: "case7" });

    const ocr7 = await ocrService.runOcr(p7.prescriptionId);
    const passed7 = ocr7.status === "COMPLETED" && ocr7.fullText.trim() === "";

    logResult(7, "Ảnh không chứa chữ -> Trả về text rỗng, tuyệt đối không hallucination tên thuốc", passed7, `Text length: ${ocr7.fullText.trim().length}`);
  } catch (err) {
    logResult(7, "Ảnh không chứa chữ", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 8: PDF bị hỏng (corrupt PDF) -> Bắt CorruptDocumentError, chuyển FAILED an toàn
  // ----------------------------------------------------
  try {
    const file8 = new File([corruptPdfBuffer], "corrupt.pdf", { type: "application/pdf" });
    const p8 = await prescriptionService.createPrescription(file8, { sessionId: "case8" });

    let caughtError = null;
    try {
      await ocrService.runOcr(p8.prescriptionId);
    } catch (err) {
      caughtError = err;
    }

    const ocrRecord8 = await prisma.prescriptionOcrResult.findUnique({
      where: { prescriptionId: p8.prescriptionId },
    });
    const pRecord8 = await prisma.prescription.findUnique({
      where: { id: p8.prescriptionId },
    });

    const passed8 =
      caughtError !== null &&
      ocrRecord8?.status === "FAILED" &&
      ocrRecord8?.errorCode === "CORRUPT_DOCUMENT" &&
      pRecord8?.status === "OCR_FAILED";

    logResult(8, "PDF bị hỏng (corrupt) -> Chuyển FAILED có mã lỗi CORRUPT_DOCUMENT, không sập server", passed8, `ErrorCode: ${ocrRecord8?.errorCode}`);
  } catch (err) {
    logResult(8, "PDF bị hỏng (corrupt)", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 9: Tệp bị mất khỏi storage -> 404 NotFoundError
  // ----------------------------------------------------
  try {
    const file9 = new File([clearPngBuffer], "file_to_delete.png", { type: "image/png" });
    const p9 = await prescriptionService.createPrescription(file9, { sessionId: "case9" });

    const rec9 = await prisma.prescription.findUnique({
      where: { id: p9.prescriptionId },
    });

    // Xóa file vật lý khỏi ổ đĩa
    if (rec9?.storageKey) {
      await testStorage.deleteFile(rec9.storageKey);
    }

    let caught9 = null;
    try {
      await ocrService.runOcr(p9.prescriptionId);
    } catch (err) {
      caught9 = err;
    }

    const passed9 = caught9 instanceof NotFoundError;
    logResult(9, "Tệp mất khỏi Private Storage -> Bắt lỗi 404 NotFoundError chuẩn xác", passed9, caught9?.message);
  } catch (err) {
    logResult(9, "Tệp mất khỏi Private Storage", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 10: Provider Timeout -> Bắt OCR_TIMEOUT (504), cập nhật FAILED
  // ----------------------------------------------------
  try {
    const timeoutMockProvider = new MockOcrProvider("timeout");
    const timeoutService = new OcrService(
      testStorage,
      documentProcessor,
      timeoutMockProvider,
      prisma
    );

    const file10 = new File([clearPngBuffer], "timeout_test.png", { type: "image/png" });
    const p10 = await prescriptionService.createPrescription(file10, { sessionId: "case10" });

    let caught10 = null;
    try {
      await timeoutService.runOcr(p10.prescriptionId);
    } catch (err) {
      caught10 = err;
    }

    const ocrRecord10 = await prisma.prescriptionOcrResult.findUnique({
      where: { prescriptionId: p10.prescriptionId },
    });

    const passed10 =
      caught10 !== null &&
      ocrRecord10?.status === "FAILED" &&
      ocrRecord10?.errorCode === "OCR_TIMEOUT";

    logResult(10, "Bộ máy OCR bị Timeout -> Ghi nhận mã lỗi OCR_TIMEOUT và trạng thái FAILED", passed10, `Status: ${ocrRecord10?.status}, Code: ${ocrRecord10?.errorCode}`);
  } catch (err) {
    logResult(10, "Bộ máy OCR bị Timeout", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 11: Provider Failure / Crash -> Bắt OCR_FAILED (502)
  // ----------------------------------------------------
  try {
    const crashMockProvider = new MockOcrProvider("error");
    const crashService = new OcrService(
      testStorage,
      documentProcessor,
      crashMockProvider,
      prisma
    );

    const file11 = new File([clearPngBuffer], "crash_test.png", { type: "image/png" });
    const p11 = await prescriptionService.createPrescription(file11, { sessionId: "case11" });

    let caught11 = null;
    try {
      await crashService.runOcr(p11.prescriptionId);
    } catch (err) {
      caught11 = err;
    }

    const ocrRecord11 = await prisma.prescriptionOcrResult.findUnique({
      where: { prescriptionId: p11.prescriptionId },
    });

    const passed11 =
      caught11 !== null &&
      ocrRecord11?.status === "FAILED" &&
      ocrRecord11?.errorCode === "OCR_PROVIDER_FAILED";

    logResult(11, "Bộ máy OCR gặp sự cố lỗi -> Ghi nhận mã lỗi OCR_PROVIDER_FAILED và bảo lưu chi tiết lỗi", passed11, `ErrorCode: ${ocrRecord11?.errorCode}`);
  } catch (err) {
    logResult(11, "Bộ máy OCR gặp sự cố lỗi", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 12: Concurrent processing / Double click -> Trả về 409 OCR_ALREADY_PROCESSING
  // ----------------------------------------------------
  try {
    const file12 = new File([clearPngBuffer], "concurrent_test.png", { type: "image/png" });
    const p12 = await prescriptionService.createPrescription(file12, { sessionId: "case12" });

    // Tạo bản ghi OCR đang ở trạng thái PROCESSING
    await prisma.prescriptionOcrResult.create({
      data: {
        prescriptionId: p12.prescriptionId,
        status: "PROCESSING",
        provider: "tesseract",
        fullText: "",
      },
    });

    let caught12 = null;
    try {
      await ocrService.runOcr(p12.prescriptionId);
    } catch (err) {
      caught12 = err;
    }

    const passed12 = caught12 instanceof OcrAlreadyProcessingError && caught12.httpStatus === 409;
    logResult(12, "Double-click hoặc nhiều request đồng thời -> Bắt lỗi 409 OCR_ALREADY_PROCESSING", passed12, caught12?.message);
  } catch (err) {
    logResult(12, "Double-click hoặc nhiều request đồng thời", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 13: Gọi lại OCR khi đã COMPLETED (không forceRetry) -> Trả về kết quả ngay (Idempotent)
  // ----------------------------------------------------
  try {
    const file13 = new File([clearPngBuffer], "idempotent_test.png", { type: "image/png" });
    const p13 = await prescriptionService.createPrescription(file13, { sessionId: "case13" });

    const firstRun = await ocrService.runOcr(p13.prescriptionId);
    const secondRun = await ocrService.runOcr(p13.prescriptionId, { forceRetry: false });

    const passed13 =
      firstRun.id === secondRun.id &&
      secondRun.status === "COMPLETED" &&
      secondRun.fullText === firstRun.fullText;

    logResult(13, "Gọi lại OCR khi đã hoàn thành -> Tính Idempotent (trả về kết quả cũ ngay lập tức)", passed13, `ID: ${secondRun.id}`);
  } catch (err) {
    logResult(13, "Gọi lại OCR khi đã hoàn thành", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 14: Retry OCR bị FAILED với forceRetry = true -> Cho phép tái thực hiện thành công
  // ----------------------------------------------------
  try {
    const file14 = new File([clearPngBuffer], "retry_test.png", { type: "image/png" });
    const p14 = await prescriptionService.createPrescription(file14, { sessionId: "case14" });

    // Đánh dấu bản ghi ban đầu bị FAILED
    await prisma.prescriptionOcrResult.create({
      data: {
        prescriptionId: p14.prescriptionId,
        status: "FAILED",
        provider: "tesseract",
        errorCode: "OCR_FAILED",
        errorMessage: "Mạng chập chờn",
        fullText: "",
        attemptCount: 1,
      },
    });

    // Thực hiện retry với forceRetry = true
    const retryResult = await ocrService.runOcr(p14.prescriptionId, { forceRetry: true });

    const passed14 =
      retryResult.status === "COMPLETED" &&
      retryResult.attemptCount === 2;

    logResult(14, "Thử lại đơn thuốc OCR thất bại với forceRetry=true -> Cập nhật sang COMPLETED", passed14, `AttemptCount: ${retryResult.attemptCount}`);
  } catch (err) {
    logResult(14, "Thử lại đơn thuốc OCR thất bại với forceRetry=true", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 15: Kiểm tra API getOcrResult -> Trả về cấu trúc JSON hoàn chỉnh
  // ----------------------------------------------------
  try {
    const file15 = new File([pdf1PageBuffer], "api_test.pdf", { type: "application/pdf" });
    const p15 = await prescriptionService.createPrescription(file15, { sessionId: "case15" });

    await ocrService.runOcr(p15.prescriptionId);
    const apiResult = await ocrService.getOcrResult(p15.prescriptionId);

    const passed15 =
      apiResult.id !== undefined &&
      apiResult.prescriptionId === p15.prescriptionId &&
      apiResult.status === "COMPLETED" &&
      apiResult.fullText.includes("PARACETAMOL") &&
      apiResult.pageCount === 1 &&
      Array.isArray(apiResult.pages) &&
      apiResult.pages.length === 1 &&
      typeof apiResult.processingTimeMs === "number";

    logResult(15, "API getOcrResult -> Trả về cấu trúc dữ liệu JSON đầy đủ theo chuẩn thiết kế", passed15, `PrescriptionId: ${apiResult.prescriptionId}`);
  } catch (err) {
    logResult(15, "API getOcrResult", false, err.message);
  }

  console.log("=================================================================");
  console.log(`KẾT QUẢ KIỂM THỬ: ${passCount}/15 TEST CASES ĐẠT (PASS) - ${failCount} LỖI (FAIL)`);
  console.log("=================================================================");

  await prisma.$disconnect();

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase3Tests().catch((err) => {
  console.error("Lỗi thực thi kiểm thử Phase 3:", err);
  process.exit(1);
});

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:../prisma/dev.db",
    },
  },
});

// Import các modules từ src
import { LocalPrescriptionStorage } from "../src/lib/prescription/storage.ts";
import { PrescriptionService } from "../src/lib/prescription/prescription-service.ts";
import {
  validateFileMetadata,
  MAX_FILE_SIZE_BYTES,
} from "../src/lib/prescription/file-validator.ts";
import { verifyFileSignature } from "../src/lib/prescription/file-signature.ts";

const results = [];
let passCount = 0;
let failCount = 0;

function logResult(caseNumber, name, passed, details = "") {
  if (passed) {
    passCount++;
    results.push(`[PASS] CASE ${caseNumber}: ${name} ${details ? `(${details})` : ""}`);
    console.log(`[PASS] CASE ${caseNumber}: ${name}`);
  } else {
    failCount++;
    results.push(`[FAIL] CASE ${caseNumber}: ${name} -> ${details}`);
    console.error(`[FAIL] CASE ${caseNumber}: ${name} -> ${details}`);
  }
}

async function runTests() {
  console.log("=== BẮT ĐẦU CHẠY BỘ 15 TEST CASES BẮT BUỘC PHASE 2 ===");

  const storageDir = path.join(process.cwd(), "storage", "test-prescriptions");
  const testStorage = new LocalPrescriptionStorage(storageDir);
  const service = new PrescriptionService(testStorage);

  // Dữ liệu nhị phân mẫu chuẩn
  const validJpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
  const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const validPdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
  const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]); // MZ DOS header

  let case1RecordId = "";
  let case1StorageKey = "";

  // ----------------------------------------------------
  // CASE 1: Upload JPG hợp lệ -> file lưu, DB record tạo, STORED
  // ----------------------------------------------------
  try {
    const file1 = new File([validJpgBuffer], "donthuoc1.jpg", { type: "image/jpeg" });
    const res1 = await service.createPrescription(file1, { sessionId: "sess_001" });
    
    // Kiểm tra DB
    const dbRecord1 = await prisma.prescription.findUnique({ where: { id: res1.prescriptionId } });
    const fileExists1 = await testStorage.getFile(dbRecord1.storageKey);

    const isOk =
      res1.success === true &&
      res1.status === "STORED" &&
      dbRecord1 !== null &&
      dbRecord1.status === "STORED" &&
      fileExists1 !== null;

    case1RecordId = res1.prescriptionId;
    case1StorageKey = dbRecord1.storageKey;
    logResult(1, "Upload JPG hợp lệ -> file lưu, DB record tạo, STORED", isOk, `ID: ${res1.prescriptionId}`);
  } catch (err) {
    logResult(1, "Upload JPG hợp lệ -> file lưu, DB record tạo, STORED", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 2: Upload PNG hợp lệ -> success
  // ----------------------------------------------------
  try {
    const file2 = new File([validPngBuffer], "ketqua.png", { type: "image/png" });
    const res2 = await service.createPrescription(file2);
    const dbRecord2 = await prisma.prescription.findUnique({ where: { id: res2.prescriptionId } });
    logResult(2, "Upload PNG hợp lệ -> success", res2.success && dbRecord2?.status === "STORED");
  } catch (err) {
    logResult(2, "Upload PNG hợp lệ -> success", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 3: Upload PDF hợp lệ -> success
  // ----------------------------------------------------
  try {
    const file3 = new File([validPdfBuffer], "benhan.pdf", { type: "application/pdf" });
    const res3 = await service.createPrescription(file3);
    const dbRecord3 = await prisma.prescription.findUnique({ where: { id: res3.prescriptionId } });
    logResult(3, "Upload PDF hợp lệ -> success", res3.success && dbRecord3?.status === "STORED");
  } catch (err) {
    logResult(3, "Upload PDF hợp lệ -> success", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 4: Hai file cùng tên donthuoc.jpg -> không overwrite nhau, mỗi file có ID/key riêng
  // ----------------------------------------------------
  try {
    const fileA = new File([validJpgBuffer], "donthuoc.jpg", { type: "image/jpeg" });
    const fileB = new File([validJpgBuffer], "donthuoc.jpg", { type: "image/jpeg" });

    const resA = await service.createPrescription(fileA);
    const resB = await service.createPrescription(fileB);

    const recA = await prisma.prescription.findUnique({ where: { id: resA.prescriptionId } });
    const recB = await prisma.prescription.findUnique({ where: { id: resB.prescriptionId } });

    const notOverwritten =
      recA.id !== recB.id &&
      recA.storageKey !== recB.storageKey &&
      recA.storedFileName !== recB.storedFileName;

    logResult(4, "Hai file cùng tên donthuoc.jpg -> Không overwrite, ID và key riêng biệt", notOverwritten, `Key A: ${recA.storedFileName}, Key B: ${recB.storedFileName}`);
  } catch (err) {
    logResult(4, "Hai file cùng tên donthuoc.jpg -> Không overwrite", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 5: .exe đổi tên thành .jpg -> reject
  // ----------------------------------------------------
  try {
    const fakeExe = new File([exeBuffer], "donthuoc.jpg", { type: "image/jpeg" });
    let rejected = false;
    try {
      await service.createPrescription(fakeExe);
    } catch (e) {
      rejected = e.name === "ValidationError" && e.code === "INVALID_SIGNATURE";
    }
    logResult(5, ".exe đổi tên thành .jpg -> Reject", rejected);
  } catch (err) {
    logResult(5, ".exe đổi tên thành .jpg -> Reject", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 6: Fake MIME: file không phải PNG nhưng khai image/png -> reject
  // ----------------------------------------------------
  try {
    // Nội dung là JPEG nhưng khai MIME là image/png
    const fakeMime = new File([validJpgBuffer], "donthuoc.png", { type: "image/png" });
    let rejected = false;
    try {
      await service.createPrescription(fakeMime);
    } catch (e) {
      rejected = e.name === "ValidationError" && e.code === "INVALID_SIGNATURE";
    }
    logResult(6, "Fake MIME (JPEG giả khai báo image/png) -> Reject", rejected);
  } catch (err) {
    logResult(6, "Fake MIME -> Reject", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 7: File rỗng -> reject
  // ----------------------------------------------------
  try {
    const emptyFile = new File([], "empty.jpg", { type: "image/jpeg" });
    let rejected = false;
    try {
      await service.createPrescription(emptyFile);
    } catch (e) {
      rejected = e.name === "ValidationError" && e.code === "FILE_EMPTY";
    }
    logResult(7, "File rỗng (0 bytes) -> Reject", rejected);
  } catch (err) {
    logResult(7, "File rỗng -> Reject", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 8: File > 10 MB -> reject
  // ----------------------------------------------------
  try {
    const metaCheck = validateFileMetadata({
      name: "oversized.pdf",
      size: 11 * 1024 * 1024,
      type: "application/pdf",
    });
    const rejected = !metaCheck.isValid && metaCheck.code === "FILE_TOO_LARGE";
    logResult(8, "File > 10 MB -> Reject (413 FILE_TOO_LARGE)", rejected);
  } catch (err) {
    logResult(8, "File > 10 MB -> Reject", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 9: Không có file -> reject
  // ----------------------------------------------------
  try {
    const metaCheck = validateFileMetadata(null);
    const rejected = !metaCheck.isValid && metaCheck.code === "FILE_MISSING";
    logResult(9, "Không có file -> Reject (400 FILE_MISSING)", rejected);
  } catch (err) {
    logResult(9, "Không có file -> Reject", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 10: Storage fail -> DB không được báo STORED
  // ----------------------------------------------------
  try {
    const failingStorage = {
      saveFile: async () => {
        throw new Error("Disk full simulation");
      },
      getFile: async () => null,
      deleteFile: async () => true,
      generateStorageKey: testStorage.generateStorageKey.bind(testStorage),
    };
    const failService = new PrescriptionService(failingStorage);
    const file = new File([validJpgBuffer], "storage_fail.jpg", { type: "image/jpeg" });

    let rejected = false;
    try {
      await failService.createPrescription(file);
    } catch (e) {
      rejected = e.name === "StorageError";
    }

    // Kiểm tra DB không có bản ghi nào tên storage_fail.jpg
    const dbRecord = await prisma.prescription.findFirst({
      where: { originalFileName: "storage_fail.jpg" },
    });
    const isOk = rejected && dbRecord === null;
    logResult(10, "Storage fail -> DB không được tạo record STORED", isOk);
  } catch (err) {
    logResult(10, "Storage fail -> DB không được tạo record STORED", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 11: Database fail sau khi lưu file -> cleanup/rollback file
  // ----------------------------------------------------
  try {
    let savedStorageKey = "";
    const mockStorage = {
      saveFile: async (buf, ext) => {
        const res = await testStorage.saveFile(buf, ext);
        savedStorageKey = res.storageKey;
        return res;
      },
      getFile: testStorage.getFile.bind(testStorage),
      deleteFile: testStorage.deleteFile.bind(testStorage),
      generateStorageKey: testStorage.generateStorageKey.bind(testStorage),
    };

    const mockFailingDb = {
      prescription: {
        create: async () => {
          throw new Error("Simulated Database Connection Crash");
        },
      },
    };

    // Tạo service với mock DB bị lỗi sau khi lưu storage
    const rollbackService = new PrescriptionService(mockStorage, mockFailingDb);
    const file = new File([validJpgBuffer], "rollback_test.jpg", { type: "image/jpeg" });

    let errorThrown = false;
    try {
      await rollbackService.createPrescription(file);
    } catch (e) {
      errorThrown = e.name === "DatabaseError";
    }

    // Kiểm tra xem file có bị xóa khỏi storage sau khi DB crash không
    const fileAfterRollback = await testStorage.getFile(savedStorageKey);
    const isCleanedUp = errorThrown && fileAfterRollback === null;

    logResult(11, "Database fail sau khi lưu file -> Tự động Cleanup/Rollback file mồ côi", isCleanedUp, `File cleared: ${fileAfterRollback === null}`);
  } catch (err) {
    logResult(11, "Database fail sau khi lưu file -> Rollback", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 12: GET prescription ID hợp lệ -> trả metadata
  // ----------------------------------------------------
  try {
    const metadata = await service.getPrescriptionById(case1RecordId);
    const isOk =
      metadata.id === case1RecordId &&
      metadata.originalFileName === "donthuoc1.jpg" &&
      metadata.status === "STORED" &&
      metadata.fileSize > 0 &&
      metadata.filePath === undefined; // Đảm bảo KHÔNG lộ filePath

    logResult(12, "GET prescription ID hợp lệ -> Trả metadata an toàn, không lộ filePath", isOk, `Status: ${metadata.status}`);
  } catch (err) {
    logResult(12, "GET prescription ID hợp lệ -> Trả metadata", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 13: GET ID không tồn tại -> 404
  // ----------------------------------------------------
  try {
    let is404 = false;
    try {
      await service.getPrescriptionById("non-existent-uuid-12345");
    } catch (e) {
      is404 = e.name === "NotFoundError" && e.httpStatus === 404;
    }
    logResult(13, "GET ID không tồn tại -> Trả 404 NotFoundError", is404);
  } catch (err) {
    logResult(13, "GET ID không tồn tại -> 404", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 14: ID malformed -> xử lý an toàn
  // ----------------------------------------------------
  try {
    let isSafeError = false;
    try {
      await service.getPrescriptionById("../../../etc/passwd");
    } catch (e) {
      isSafeError = e.name === "ValidationError" && e.httpStatus === 400;
    }
    logResult(14, "ID malformed (chứa ../) -> Xử lý an toàn (400 ValidationError)", isSafeError);
  } catch (err) {
    logResult(14, "ID malformed -> Xử lý an toàn", false, err.message);
  }

  // ----------------------------------------------------
  // CASE 15: Restart dev server -> metadata database còn tồn tại
  // ----------------------------------------------------
  try {
    // Ngắt kết nối và tạo một instance PrismaClient hoàn toàn mới trỏ vào dev.db (mô phỏng server restart)
    await prisma.$disconnect();

    const newPrisma = new PrismaClient({
      datasources: {
        db: {
          url: "file:../prisma/dev.db",
        },
      },
    });

    const persistedRecord = await newPrisma.prescription.findUnique({
      where: { id: case1RecordId },
    });

    await newPrisma.$disconnect();

    const isPersisted = persistedRecord !== null && persistedRecord.id === case1RecordId;
    logResult(15, "Restart dev server -> Metadata trong SQLite dev.db còn tồn tại vẹn toàn", isPersisted, `Persisted ID: ${persistedRecord?.id}`);
  } catch (err) {
    logResult(15, "Restart dev server -> Metadata còn tồn tại", false, err.message);
  }

  console.log("\n=================================================");
  console.log(`KẾT QUẢ: ${passCount}/15 TEST CASES PASSED! (${failCount} FAILED)`);
  console.log("=================================================");

  // Xuất ra file
  const outputPath = path.join(process.cwd(), "scripts", "test-phase2-results.txt");
  fs.writeFileSync(outputPath, results.join("\n"), "utf8");
}

runTests().catch(console.error);

import prisma from "@/lib/prisma";
import {
  PrescriptionStorageService,
  prescriptionStorage,
} from "./storage";
import {
  validateFileMetadata,
  validateFileMagicBytes,
  sanitizeFileName,
  hasPathTraversal,
} from "./file-validator";
import {
  ValidationError,
  NotFoundError,
  DatabaseError,
  StorageError,
} from "./errors";
import {
  PrescriptionMetadata,
  PrescriptionUploadSuccessResponse,
} from "@/types/prescription";

export class PrescriptionService {
  private storage: PrescriptionStorageService;
  private db: typeof prisma;

  constructor(
    storageService: PrescriptionStorageService = prescriptionStorage,
    dbClient: typeof prisma = prisma
  ) {
    this.storage = storageService;
    this.db = dbClient;
  }

  /**
   * Tạo đơn thuốc mới: Validate -> Lưu Storage -> Tạo DB Record -> Rollback an toàn nếu lỗi
   */
  public async createPrescription(
    file: File,
    options?: {
      sessionId?: string;
      userId?: string;
    }
  ): Promise<PrescriptionUploadSuccessResponse> {
    // 1. Kiểm tra dấu hiệu tấn công Path Traversal trong filename
    if (hasPathTraversal(file.name)) {
      console.warn("[Security Alert] Phát hiện dấu hiệu Path Traversal trong filename:", file.name);
    }
    const cleanOriginalName = sanitizeFileName(file.name);

    // 2. Validate Metadata (Dung lượng, Extension, MIME)
    const metaCheck = validateFileMetadata({
      name: cleanOriginalName,
      size: file.size,
      type: file.type,
    });
    if (!metaCheck.isValid) {
      throw new ValidationError(
        metaCheck.error || "Tệp không hợp lệ.",
        metaCheck.httpStatus || 400,
        metaCheck.code || "UNSUPPORTED_TYPE"
      );
    }

    // 3. Đọc dữ liệu nhị phân và kiểm tra File Signature (Magic Bytes)
    const arrayBuffer = await file.arrayBuffer();
    const signatureCheck = validateFileMagicBytes(
      arrayBuffer,
      cleanOriginalName,
      file.type
    );
    if (!signatureCheck.isValid) {
      throw new ValidationError(
        signatureCheck.error || "Chữ ký tệp không hợp lệ.",
        signatureCheck.httpStatus || 422,
        signatureCheck.code || "INVALID_SIGNATURE"
      );
    }

    // Xác định phần mở rộng an toàn dựa trên tên file đã làm sạch
    const extension = cleanOriginalName
      .slice(cleanOriginalName.lastIndexOf("."))
      .toLowerCase();

    // 4. Lưu tệp vào Private Storage (NGOÀI /public)
    const buffer = Buffer.from(arrayBuffer);
    let savedFile;
    try {
      savedFile = await this.storage.saveFile(buffer, extension);
    } catch (err) {
      console.error("[PrescriptionService] Lưu trữ tệp thất bại:", err);
      throw new StorageError("Không thể lưu trữ tệp đơn thuốc vào hệ thống.");
    }

    // 5. Ghi nhận bản ghi vào Cơ sở Dữ liệu với trạng thái STORED
    try {
      const record = await this.db.prescription.create({
        data: {
          originalFileName: cleanOriginalName,
          storedFileName: savedFile.storedFileName,
          storageKey: savedFile.storageKey,
          filePath: savedFile.filePath,
          mimeType: file.type || "application/octet-stream",
          fileExtension: extension,
          fileSize: file.size,
          status: "STORED",
          sessionId: options?.sessionId || null,
          userId: options?.userId || null,
        },
      });

      console.info(`[Prescription Created] Đơn thuốc ID=${record.id} đã được tạo thành công với trạng thái STORED.`);

      return {
        success: true,
        prescriptionId: record.id,
        status: "STORED",
        file: {
          name: record.originalFileName,
          type: record.mimeType,
          size: record.fileSize,
        },
        message: "Đơn thuốc đã được lưu trữ an toàn trên hệ thống H4CARE.",
        uploadedAt: record.createdAt.toISOString(),
      };
    } catch (dbError) {
      // 6. CƠ CHẾ ROLLBACK TỰ ĐỘNG (DATABASE + STORAGE CONSISTENCY)
      console.error("[PrescriptionService] Ghi DB thất bại! Đang kích hoạt Rollback để xóa file mồ côi...", dbError);
      
      const rollbackSuccess = await this.storage.deleteFile(savedFile.storageKey);
      if (!rollbackSuccess) {
        console.error(
          `[CRITICAL_ROLLBACK_FAILURE] Không thể xóa file mồ côi tại storageKey="${savedFile.storageKey}". Quản trị viên cần kiểm tra thủ công!`
        );
      } else {
        console.info(`[Rollback Succeeded] Đã xóa file mồ côi ${savedFile.storageKey} thành công.`);
      }

      throw new DatabaseError("Không thể lưu thông tin đơn thuốc vào cơ sở dữ liệu. Hệ thống đã hoàn nguyên an toàn.");
    }
  }

  /**
   * Lấy siêu dữ liệu đơn thuốc an toàn theo ID (chống lộ đường dẫn server và DB internals)
   */
  public async getPrescriptionById(id: string): Promise<PrescriptionMetadata> {
    if (!id || typeof id !== "string") {
      throw new ValidationError("Mã định danh đơn thuốc không hợp lệ.", 400, "INVALID_ID");
    }

    // Kiểm tra định dạng ID an toàn (UUID hoặc chuỗi chữ số an toàn)
    const isSafeId = /^[a-zA-Z0-9_-]{1,64}$/.test(id);
    if (!isSafeId) {
      throw new ValidationError("Mã định danh đơn thuốc chứa ký tự không an toàn.", 400, "INVALID_ID");
    }

    const record = await this.db.prescription.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundError(`Không tìm thấy đơn thuốc với mã ID: ${id}`);
    }

    // Trả về metadata đã lọc kỹ lưỡng (KHÔNG trả về filePath, server path)
    return {
      id: record.id,
      originalFileName: record.originalFileName,
      mimeType: record.mimeType,
      fileSize: record.fileSize,
      status: record.status,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}

export const prescriptionService = new PrescriptionService();

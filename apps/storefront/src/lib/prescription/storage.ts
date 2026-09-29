import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { StorageError } from "./errors";

export interface StorageSaveResult {
  storageKey: string;
  storedFileName: string;
  filePath: string;
}

export interface StorageKeyInfo {
  storageKey: string;
  storedFileName: string;
  subDir: string;
}

export interface PrescriptionStorageService {
  saveFile(fileBuffer: Buffer | Uint8Array, extension: string): Promise<StorageSaveResult>;
  getFile(storageKey: string): Promise<Buffer | null>;
  deleteFile(storageKey: string): Promise<boolean>;
  generateStorageKey(extension: string): StorageKeyInfo;
}

/**
 * LocalFileStorageAdapter
 * Lưu trữ tệp đơn thuốc an toàn vào thư mục riêng tư (PRIVATE) nằm NGOÀI /public.
 * Đảm bảo:
 * 1. Chống Path Traversal (tên file luôn là UUID sinh bởi máy chủ).
 * 2. Chống File Overwrite và Filename Collision (mỗi file có UUID riêng biệt).
 * 3. Bảo vệ dữ liệu sức khỏe (không thể truy cập công khai qua URL).
 * 4. Sẵn sàng thay thế bằng Cloudflare R2 / AWS S3 / Supabase Storage mà không thay đổi API.
 */
export class LocalPrescriptionStorage implements PrescriptionStorageService {
  private baseStorageDir: string;

  constructor(customBaseDir?: string) {
    // Lưu vào thư mục /storage/prescriptions/ nằm ở root của apps/storefront (NGOÀI /public)
    this.baseStorageDir =
      customBaseDir ||
      path.join(process.cwd(), "storage", "prescriptions");
  }

  /**
   * Sinh khóa lưu trữ an toàn theo phân cấp thời gian: prescriptions/YYYY/MM/<uuid>.<ext>
   */
  public generateStorageKey(extension: string): StorageKeyInfo {
    const cleanExt = extension.startsWith(".") ? extension : `.${extension}`;
    const fileId = crypto.randomUUID();
    const storedFileName = `${fileId}${cleanExt}`;

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const subDir = path.join(year, month);
    const storageKey = `prescriptions/${year}/${month}/${storedFileName}`;

    return {
      storageKey,
      storedFileName,
      subDir,
    };
  }

  /**
   * Lưu buffer của tệp đơn thuốc vào hệ thống đĩa an toàn
   */
  public async saveFile(
    fileBuffer: Buffer | Uint8Array,
    extension: string
  ): Promise<StorageSaveResult> {
    try {
      const { storageKey, storedFileName, subDir } = this.generateStorageKey(extension);
      const targetDir = path.join(this.baseStorageDir, subDir);

      // Tạo thư mục nếu chưa tồn tại
      await fs.mkdir(targetDir, { recursive: true });

      const targetPath = path.join(targetDir, storedFileName);
      const buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);

      await fs.writeFile(targetPath, buffer);

      return {
        storageKey,
        storedFileName,
        filePath: targetPath,
      };
    } catch (error) {
      console.error("[Storage Service Error] Không thể lưu file:", error);
      throw new StorageError("Không thể ghi tệp đơn thuốc vào hệ thống lưu trữ an toàn.");
    }
  }

  /**
   * Đọc tệp từ hệ thống lưu trữ (dành cho bác sĩ / dược sĩ nội bộ hoặc pipeline OCR Phase 3)
   */
  public async getFile(storageKey: string): Promise<Buffer | null> {
    try {
      // Bảo vệ chống Path Traversal trong storageKey
      if (storageKey.includes("..") || path.isAbsolute(storageKey)) {
        throw new Error("Phát hiện đường dẫn storageKey không an toàn.");
      }

      // storageKey dạng: prescriptions/YYYY/MM/<uuid>.<ext>
      // Bỏ tiền tố "prescriptions/" để ghép với baseStorageDir
      const relativePart = storageKey.startsWith("prescriptions/")
        ? storageKey.replace("prescriptions/", "")
        : storageKey;

      const fullPath = path.join(this.baseStorageDir, relativePart);
      return await fs.readFile(fullPath);
    } catch (error) {
      return null;
    }
  }

  /**
   * Xóa tệp khỏi storage - phục vụ cơ chế ROLLBACK khi ghi DB thất bại
   */
  public async deleteFile(storageKey: string): Promise<boolean> {
    try {
      if (storageKey.includes("..") || path.isAbsolute(storageKey)) {
        return false;
      }

      const relativePart = storageKey.startsWith("prescriptions/")
        ? storageKey.replace("prescriptions/", "")
        : storageKey;

      const fullPath = path.join(this.baseStorageDir, relativePart);
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      console.error(`[Storage Rollback Error] Không thể xóa file ${storageKey}:`, error);
      return false;
    }
  }
}

// Singleton storage service instance
export const prescriptionStorage = new LocalPrescriptionStorage();

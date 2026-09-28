import {
  PrescriptionUploadResponse,
  PrescriptionUploadErrorResponse,
} from "@/types/prescription";

export interface UploadOptions {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

/**
 * Service tải file đơn thuốc lên API Endpoint /api/prescription/upload
 * Sử dụng XMLHttpRequest để đo lường tiến trình tải lên (Progress Event) chính xác.
 */
export function uploadPrescriptionFile(
  file: File,
  options?: UploadOptions
): Promise<PrescriptionUploadResponse> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    // Xử lý AbortSignal nếu component bị unmount hoặc người dùng chủ động hủy
    if (options?.signal) {
      options.signal.addEventListener("abort", () => {
        xhr.abort();
        const cancelResponse: PrescriptionUploadErrorResponse = {
          success: false,
          message: "Quá trình tải lên đã bị hủy bởi người dùng.",
        };
        resolve(cancelResponse);
      });
    }

    // Bắt sự kiện cập nhật tiến trình
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options?.onProgress) {
        const percentComplete = Math.min(
          100,
          Math.round((event.loaded / event.total) * 100)
        );
        options.onProgress(percentComplete);
      }
    };

    // Khi request hoàn tất
    xhr.onload = () => {
      try {
        const status = xhr.status;
        const responseData = JSON.parse(
          xhr.responseText || "{}"
        ) as PrescriptionUploadResponse;

        if (status >= 200 && status < 300) {
          resolve(responseData);
        } else {
          // Trả về lỗi đã chuẩn hóa từ backend
          resolve({
            success: false,
            message:
              responseData.message ||
              `Yêu cầu tải lên thất bại với mã lỗi HTTP ${status}.`,
            code: responseData.success === false ? responseData.code : undefined,
          });
        }
      } catch {
        resolve({
          success: false,
          message:
            "Không thể phân tích phản hồi từ máy chủ. Vui lòng thử lại sau.",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    };

    // Bắt lỗi mất kết nối mạng
    xhr.onerror = () => {
      resolve({
        success: false,
        message:
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối Internet của bạn.",
        code: "NETWORK_ERROR",
      });
    };

    // Xử lý timeout quá 45 giây
    xhr.timeout = 45000;
    xhr.ontimeout = () => {
      resolve({
        success: false,
        message:
          "Thời gian tải lên quá lâu (hết thời gian chờ). Vui lòng thử lại với file nhỏ hơn hoặc đường truyền ổn định hơn.",
        code: "NETWORK_ERROR",
      });
    };

    xhr.open("POST", "/api/prescription/upload", true);
    xhr.send(formData);
  });
}

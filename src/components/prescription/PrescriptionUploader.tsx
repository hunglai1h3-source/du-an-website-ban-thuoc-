"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  UploadCloud,
  FileCheck,
  ShieldCheck,
  Clock,
  ArrowRight,
  PlusCircle,
  FileUp,
  Info,
} from "lucide-react";
import {
  PrescriptionStatus,
  PrescriptionFile,
  PrescriptionUploadResponse,
  PrescriptionUploadSuccessResponse,
  ValidationErrorCode,
} from "@/types/prescription";
import {
  validateFileMetadata,
  ALLOWED_EXTENSIONS,
  formatFileSize,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/prescription/file-validator";
import { uploadPrescriptionFile } from "@/lib/prescription/upload";
import { FilePreview } from "./FilePreview";
import { UploadProgress } from "./UploadProgress";
import { UploadError } from "./UploadError";

interface PrescriptionUploaderProps {
  onUploadSuccess?: (response: PrescriptionUploadSuccessResponse) => void;
}

export const PrescriptionUploader: React.FC<PrescriptionUploaderProps> = ({
  onUploadSuccess,
}) => {
  const [status, setStatus] = useState<PrescriptionStatus>("idle");
  const [selectedFile, setSelectedFile] = useState<PrescriptionFile | null>(
    null
  );
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<
    ValidationErrorCode | "INTERNAL_SERVER_ERROR" | "NETWORK_ERROR" | undefined
  >(undefined);
  const [successData, setSuccessData] =
    useState<PrescriptionUploadSuccessResponse | null>(null);

  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Xóa preview URL cũ để tránh rò rỉ bộ nhớ (Memory Leak)
  const cleanupPreviewUrl = useCallback((url: string | null) => {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (selectedFile?.previewUrl) {
        cleanupPreviewUrl(selectedFile.previewUrl);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedFile, cleanupPreviewUrl]);

  // Xử lý khi người dùng chọn file (qua input hoặc kéo thả)
  const handleProcessFile = (file: File) => {
    // 1. Reset lỗi và trạng thái cũ
    setErrorMessage(null);
    setErrorCode(undefined);

    // 2. Client-side Validation
    const validation = validateFileMetadata({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!validation.isValid) {
      setErrorMessage(validation.error || "Tệp không hợp lệ.");
      setErrorCode(validation.code);
      setStatus("failed");
      return;
    }

    // 3. Giải phóng URL trước đó nếu có
    if (selectedFile?.previewUrl) {
      cleanupPreviewUrl(selectedFile.previewUrl);
    }

    // 4. Tạo ObjectURL cho preview an toàn
    let previewUrl: string | null = null;
    try {
      previewUrl = URL.createObjectURL(file);
    } catch (e) {
      console.warn("Không thể tạo ObjectURL cho preview", e);
    }

    const prescriptionItem: PrescriptionFile = {
      file,
      previewUrl,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };

    setSelectedFile(prescriptionItem);
    setStatus("idle"); // Trạng thái sẵn sàng upload
  };

  // Trình xử lý sự kiện Drag & Drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (status !== "uploading") {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (status === "uploading") return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  // Trình xử lý khi chọn qua file input thông thường
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
    // Reset value để có thể chọn lại cùng một file nếu muốn
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Kích hoạt dialog chọn file
  const triggerFileDialog = () => {
    if (status !== "uploading" && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Xóa file hiện tại
  const handleRemoveFile = () => {
    if (selectedFile?.previewUrl) {
      cleanupPreviewUrl(selectedFile.previewUrl);
    }
    setSelectedFile(null);
    setStatus("idle");
    setErrorMessage(null);
    setErrorCode(undefined);
    setUploadProgress(0);
  };

  // Thực hiện gửi tải lên API
  const handleUpload = async () => {
    if (!selectedFile) return;

    setStatus("uploading");
    setUploadProgress(0);
    setErrorMessage(null);
    setErrorCode(undefined);

    abortControllerRef.current = new AbortController();

    try {
      const response: PrescriptionUploadResponse = await uploadPrescriptionFile(
        selectedFile.file,
        {
          onProgress: (percent) => setUploadProgress(percent),
          signal: abortControllerRef.current.signal,
        }
      );

      if (response.success) {
        setStatus("uploaded");
        setSuccessData(response);
        if (onUploadSuccess) {
          onUploadSuccess(response);
        }
      } else {
        setStatus("failed");
        setErrorMessage(
          response.message || "Không thể tải lên đơn thuốc. Vui lòng thử lại."
        );
        setErrorCode(response.code);
      }
    } catch (err) {
      setStatus("failed");
      setErrorMessage(
        "Đã xảy ra lỗi không xác định trong quá trình tải lên. Vui lòng thử lại."
      );
      setErrorCode("INTERNAL_SERVER_ERROR");
    } finally {
      abortControllerRef.current = null;
    }
  };

  // Bắt đầu tải đơn thuốc mới (reset toàn bộ)
  const handleResetAll = () => {
    handleRemoveFile();
    setSuccessData(null);
    setStatus("idle");
  };

  return (
    <div className="w-full space-y-6">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={status === "uploading"}
        aria-label="Tải lên tệp đơn thuốc"
      />

      {/* 1. TRẠNG THÁI THÀNH CÔNG (SUCCESS STATE) */}
      {status === "uploaded" && successData ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-depth-2 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-emerald-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200 shadow-xs">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Đã tiếp nhận thành công
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Đơn thuốc đã được tải lên máy chủ
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-brand-blue-700 bg-brand-blue-50 hover:bg-brand-blue-100 active:scale-95 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Gửi đơn thuốc khác</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-400 font-medium block">
                Mã định danh đơn (ID)
              </span>
              <span className="text-xs font-mono font-bold text-slate-800 break-all mt-0.5 block">
                {successData.prescriptionId}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-400 font-medium block">
                Tệp tiếp nhận
              </span>
              <span className="text-xs font-bold text-slate-800 truncate mt-0.5 block">
                {successData.fileName}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {formatFileSize(successData.fileSize)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-400 font-medium block">
                Thời gian ghi nhận
              </span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                {new Date(successData.uploadedAt).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}{" "}
                -{" "}
                {new Date(successData.uploadedAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-brand-blue-50/60 border border-brand-blue-100 flex items-start gap-3">
            <Info className="w-4 h-4 text-brand-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              {successData.message} Hệ thống bảo mật y tế H4CARE đã lưu vết mã hóa
              cho đơn thuốc này. Trong các giai đoạn tiếp theo (Phase 2 & 3),
              dữ liệu sẽ được tự động phân tích OCR và chuyển tiếp đến Dược sĩ phụ
              trách.
            </p>
          </div>
        </div>
      ) : (
        /* 2. KHU VỰC CHỌN FILE HOẶC PREVIEW FILE */
        <div className="space-y-4">
          {!selectedFile ? (
            /* Drag & Drop Upload Zone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileDialog}
              className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? "border-brand-blue-500 bg-brand-blue-50/60 scale-[1.01] shadow-depth-2"
                  : "border-slate-200/90 bg-white hover:border-brand-blue-300 hover:bg-slate-50/50 shadow-depth-1"
              }`}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center mx-auto mb-4 border border-brand-blue-100 shadow-xs">
                <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10 text-brand-blue-600" />
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Kéo & thả đơn thuốc vào đây hoặc{" "}
                <span className="text-brand-blue-600 underline underline-offset-4">
                  chọn từ thiết bị
                </span>
              </h3>

              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                Hỗ trợ định dạng ảnh chụp đơn thuốc{" "}
                <span className="font-semibold text-slate-700">
                  JPG, JPEG, PNG
                </span>{" "}
                hoặc tài liệu số{" "}
                <span className="font-semibold text-slate-700">PDF</span>.
              </p>

              <div className="inline-flex items-center gap-2 mt-4 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                <FileUp className="w-3.5 h-3.5 text-slate-500" />
                <span>Giới hạn tối đa: {formatFileSize(MAX_FILE_SIZE_BYTES)}/file</span>
              </div>
            </div>
          ) : (
            /* File Preview Stage */
            <div className="space-y-4">
              <FilePreview
                file={selectedFile.file}
                previewUrl={selectedFile.previewUrl}
                onRemove={handleRemoveFile}
                onChangeFile={triggerFileDialog}
                disabled={status === "uploading"}
              />

              {/* Upload Progress Indicator */}
              {status === "uploading" && (
                <UploadProgress
                  progress={uploadProgress}
                  fileName={selectedFile.file.name}
                />
              )}

              {/* Upload Action Button */}
              {status !== "uploading" && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-brand-emerald-500" />
                    <span>Dữ liệu đơn thuốc được mã hóa bảo mật theo chuẩn GPP</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleUpload}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-brand-blue-600 hover:bg-brand-blue-700 active:scale-95 text-white font-bold text-sm shadow-medical transition-all cursor-pointer"
                  >
                    <span>Tải lên & Tiếp nhận đơn</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error Message Box */}
          {errorMessage && (
            <UploadError
              message={errorMessage}
              code={errorCode}
              onRetry={selectedFile ? handleUpload : undefined}
              onClear={handleResetAll}
            />
          )}
        </div>
      )}
    </div>
  );
};

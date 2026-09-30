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
  ScanText,
  Loader2,
  AlertTriangle,
  FileText,
  CheckCircle2,
  RotateCw,
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

  // Phase 3: OCR Pipeline States
  const [ocrStatus, setOcrStatus] = useState<"idle" | "processing" | "completed" | "failed">("idle");
  const [ocrData, setOcrData] = useState<any | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleRunOcr = async (forceRetry: boolean = false) => {
    if (!successData?.prescriptionId) return;
    setOcrStatus("processing");
    setOcrError(null);

    try {
      const res = await fetch(`/api/prescription/${successData.prescriptionId}/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceRetry }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOcrData(data.ocr);
        setOcrStatus("completed");
      } else {
        setOcrStatus("failed");
        setOcrError(data.message || "Không thể bóc tách nội dung đơn thuốc.");
      }
    } catch (err: any) {
      setOcrStatus("failed");
      setOcrError("Không thể kết nối đến máy chủ xử lý OCR.");
    }
  };

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
    setOcrStatus("idle");
    setOcrData(null);
    setOcrError(null);
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
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ✓ Đã lưu trữ an toàn (STORED)
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Đơn thuốc đã được tải lên an toàn
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {ocrStatus === "idle" && (
                <button
                  type="button"
                  onClick={() => handleRunOcr(false)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-blue-600 hover:bg-brand-blue-700 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <ScanText className="w-4 h-4" />
                  <span>Bóc tách nội dung (OCR)</span>
                </button>
              )}

              {ocrStatus === "processing" && (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-brand-blue-700 bg-brand-blue-50 border border-brand-blue-200 cursor-wait"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-brand-blue-600" />
                  <span>Đang bóc tách OCR...</span>
                </button>
              )}

              {ocrStatus === "completed" && (
                <button
                  type="button"
                  onClick={() => handleRunOcr(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-brand-blue-700 bg-brand-blue-50 hover:bg-brand-blue-100 active:scale-95 transition-all cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Nhận diện lại</span>
                </button>
              )}

              {ocrStatus === "failed" && (
                <button
                  type="button"
                  onClick={() => handleRunOcr(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-95 transition-all cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Thử lại OCR</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleResetAll}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Gửi đơn thuốc khác</span>
              </button>
            </div>
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
                {successData.file?.name || (successData as any).fileName}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {formatFileSize(successData.file?.size || (successData as any).fileSize || 0)}
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

          {/* Phase 3 OCR Workflow Section */}
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
            {ocrStatus === "idle" && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center shrink-0 border border-brand-blue-100">
                    <ScanText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Bóc tách ký tự quang học (OCR)
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Sử dụng công nghệ OCR nhận diện văn bản tiếng Việt và tiếng Anh từ đơn thuốc đã tải lên.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRunOcr(false)}
                  className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-blue-600 hover:bg-brand-blue-700 active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  <ScanText className="w-4 h-4" />
                  <span>Bắt đầu bóc tách</span>
                </button>
              </div>
            )}

            {ocrStatus === "processing" && (
              <div className="p-6 rounded-2xl bg-brand-blue-50/50 border border-brand-blue-200 flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in duration-200">
                <Loader2 className="w-8 h-8 animate-spin text-brand-blue-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Đang xử lý tài liệu & bóc tách ký tự...
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                    Hệ thống đang trích xuất văn bản từ hình ảnh/PDF (sử dụng engine OCR đa ngôn ngữ vie+eng). Quá trình có thể mất từ 5-15 giây.
                  </p>
                </div>
              </div>
            )}

            {ocrStatus === "failed" && (
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-rose-900">
                      Quá trình bóc tách OCR không thành công
                    </h4>
                    <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                      {ocrError || "Đã xảy ra lỗi trong quá trình xử lý tài liệu."}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRunOcr(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 active:scale-95 transition-all cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Thử lại</span>
                  </button>
                </div>
              </div>
            )}

            {ocrStatus === "completed" && ocrData && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Kết quả nhận diện ký tự (OCR Raw Text)
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        Engine: {ocrData.provider} | Thời gian: {ocrData.processingTimeMs}ms
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-slate-200 text-slate-700">
                      {ocrData.pageCount} trang
                    </span>
                    {ocrData.averageConfidence >= 0.6 ? (
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        Độ tin cậy: {(ocrData.averageConfidence * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        Độ tin cậy thấp: {(ocrData.averageConfidence * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>

                {ocrData.averageConfidence < 0.6 && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      <strong>Cảnh báo chất lượng:</strong> Độ tin cậy trung bình dưới 60%. Hình ảnh đơn thuốc có thể bị mờ, nghiêng, thiếu sáng hoặc viết tay khó đọc. Vui lòng đối chiếu kỹ với bản gốc.
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                    Văn bản thô đã bóc tách (Raw Text):
                  </label>
                  <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-72 leading-relaxed border border-slate-800 select-text">
                    {ocrData.fullText && ocrData.fullText.trim().length > 0
                      ? ocrData.fullText
                      : "(Không phát hiện văn bản rõ ràng trong tài liệu)"}
                  </pre>
                </div>

                {ocrData.pages && ocrData.pages.length > 1 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-slate-700 block">
                      Chi tiết từng trang ({ocrData.pages.length} trang):
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {ocrData.pages.map((p: any) => (
                        <div key={p.id || p.pageNumber} className="p-3 rounded-xl bg-white border border-slate-200 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-700">Trang {p.pageNumber}</span>
                            <span className="text-[11px] font-mono text-slate-500">
                              Độ tin cậy: {(p.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-slate-600 line-clamp-2 font-mono text-[11px]">
                            {p.text || "(Trang trống)"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-500 leading-relaxed flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    Dữ liệu trên là kết quả OCR thô nguyên bản, không qua chỉnh sửa hay suy đoán. Các bước chuẩn hóa và trích xuất cấu trúc AI sẽ được thực hiện ở các giai đoạn sau.
                  </span>
                </div>
              </div>
            )}
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

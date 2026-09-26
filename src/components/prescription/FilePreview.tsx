"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  FileText,
  FileImage,
  Trash2,
  RefreshCw,
  ExternalLink,
  Eye,
  CheckCircle2,
  X,
} from "lucide-react";
import { formatFileSize } from "@/lib/prescription/file-validator";

interface FilePreviewProps {
  file: File;
  previewUrl: string | null;
  onRemove: () => void;
  onChangeFile: () => void;
  disabled?: boolean;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  previewUrl,
  onRemove,
  onChangeFile,
  disabled = false,
}) => {
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-depth-1 p-4 sm:p-5 transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* File Thumbnail & Meta Info */}
          <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
            {/* Thumbnail Display */}
            {isPdf ? (
              <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/70 border border-rose-200 flex flex-col items-center justify-center p-2 text-rose-600 shrink-0 shadow-xs">
                <FileText className="w-7 h-7 sm:w-8 sm:h-8" />
                <span className="text-[10px] font-black uppercase tracking-wider mt-1 text-rose-700">
                  PDF DOC
                </span>
              </div>
            ) : previewUrl ? (
              <div
                onClick={() => setIsZoomOpen(true)}
                className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200/90 bg-slate-100 group cursor-pointer shrink-0 shadow-xs"
                title="Bấm để xem ảnh phóng to"
              >
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Eye className="w-5 h-5 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                <FileImage className="w-8 h-8" />
              </div>
            )}

            {/* File Information Details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Đã kiểm tra hợp lệ
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {formatFileSize(file.size)}
                </span>
              </div>

              <h4
                className="text-sm font-bold text-slate-900 mt-1 truncate"
                title={file.name}
              >
                {file.name}
              </h4>

              <p className="text-xs text-slate-500 mt-0.5">
                {isPdf
                  ? "Tài liệu đơn thuốc điện tử (PDF)"
                  : "Ảnh chụp đơn thuốc y khoa"}
              </p>

              {/* PDF Preview Trigger */}
              {isPdf && previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-brand-blue-600 hover:text-brand-blue-700 font-semibold mt-1.5 transition-colors"
                >
                  <span>Mở xem tài liệu</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <button
              type="button"
              onClick={onChangeFile}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Đổi file</span>
            </button>

            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Xóa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {isZoomOpen && previewUrl && !isPdf && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-depth-4 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 truncate">
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-900/5">
              <img
                src={previewUrl}
                alt={file.name}
                className="max-h-[75vh] w-auto object-contain rounded-xl shadow-xs"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

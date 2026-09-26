"use client";

import React from "react";
import { Loader2, ShieldCheck } from "lucide-react";

interface UploadProgressProps {
  progress: number;
  fileName: string;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  fileName,
}) => {
  return (
    <div className="p-5 rounded-2xl bg-brand-blue-50/80 border border-brand-blue-100 shadow-depth-1 animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Loader2 className="w-4 h-4 text-brand-blue-600 animate-spin shrink-0" />
          <span className="text-xs font-bold text-slate-800 truncate">
            Đang tải lên: {fileName}
          </span>
        </div>
        <span className="text-xs font-mono font-bold text-brand-blue-700 bg-brand-blue-100/80 px-2 py-0.5 rounded-full shrink-0">
          {progress}%
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full h-2.5 rounded-full bg-slate-200/80 overflow-hidden p-0.5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-blue-600 via-brand-cyan-500 to-brand-emerald-500 transition-all duration-300 ease-out"
          style={{ width: `${Math.max(5, progress)}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2.5 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 text-brand-blue-800 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald-600" />
          <span>Kênh truyền mã hóa SSL/TLS 256-bit chuẩn Y tế</span>
        </div>
        <span>
          {progress < 100 ? "Đang truyền tải..." : "Đang kiểm tra an toàn..."}
        </span>
      </div>
    </div>
  );
};

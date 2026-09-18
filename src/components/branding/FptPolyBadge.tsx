"use client";

import React from "react";

interface FptPolyBadgeProps {
  variant?: "light" | "dark" | "compact";
  className?: string;
}

export const FptPolyBadge: React.FC<FptPolyBadgeProps> = ({
  variant = "light",
  className = "",
}) => {
  const isDark = variant === "dark";

  return (
    <div
      className={`inline-flex items-center gap-3 px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all duration-300 ${
        isDark
          ? "bg-slate-900/80 border-slate-700/60 text-slate-200"
          : "bg-white/90 border-slate-200/90 text-slate-700 shadow-sm"
      } ${className}`}
    >
      {/* Official FPT Polytechnic Identity Representation */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center space-x-0.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#005da3]" title="FPT Blue" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#f26522]" title="FPT Orange" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#009639]" title="FPT Green" />
        </div>
        <span className="font-extrabold text-xs tracking-wider uppercase text-slate-800 dark:text-slate-100">
          FPT Polytechnic
        </span>
      </div>

      <div className="w-[1px] h-3.5 bg-slate-300 dark:bg-slate-700" />

      <div className="flex flex-col">
        <span className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
          Student Project • Đồ án sinh viên
        </span>
      </div>
    </div>
  );
};

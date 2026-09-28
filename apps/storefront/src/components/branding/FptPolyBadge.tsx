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
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border transition-colors select-none ${
        isDark
          ? "bg-slate-800/50 border-slate-800 text-slate-400"
          : "bg-slate-100/80 border-slate-200/70 text-slate-500"
      } ${className}`}
    >
      {/* Subtle 3-color academic dot indicator */}
      <div className="flex items-center space-x-1 opacity-75">
        <span className="w-1.5 h-1.5 rounded-full bg-[#005da3]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#f26522]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#009639]" />
      </div>

      <span className="text-[10px] font-medium tracking-normal text-slate-400">
        Đồ án thực hành •{" "}
        <span className={isDark ? "text-slate-300 font-semibold" : "text-slate-700 font-semibold"}>
          FPT Polytechnic
        </span>
      </span>
    </div>
  );
};

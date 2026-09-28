"use client";

import React from "react";
import Link from "next/link";
import { AbstractSymbol } from "./AbstractSymbol";

interface H4CareLogoProps {
  variant?: "full" | "minimal" | "white";
  size?: "sm" | "md" | "lg";
  withTagline?: boolean;
  className?: string;
  href?: string;
}

export const H4CareLogo: React.FC<H4CareLogoProps> = ({
  variant = "full",
  size = "md",
  withTagline = false,
  className = "",
  href = "/",
}) => {
  const symbolSizes = {
    sm: 32,
    md: 40,
    lg: 52,
  };

  const textSizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const taglineSizes = {
    sm: "text-[10px]",
    md: "text-[11px]",
    lg: "text-xs",
  };

  const isWhite = variant === "white";

  const content = (
    <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* Bespoke 4-part Symbol */}
      <AbstractSymbol size={symbolSizes[size]} withGlow={!isWhite} />

      {/* Brand Wordmark */}
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline tracking-tight leading-none">
          <span
            className={`font-black tracking-tight ${textSizes[size]} ${
              isWhite ? "text-white" : "text-brand-blue-700"
            }`}
          >
            H<span className={isWhite ? "text-brand-cyan-300" : "text-brand-cyan-500"}>4</span>
          </span>
          <span
            className={`font-extrabold tracking-tight ml-0.5 ${textSizes[size]} ${
              isWhite ? "text-slate-100" : "text-slate-900"
            }`}
          >
            CARE
          </span>
          <span
            className={`ml-1 text-[0.6em] font-black leading-none px-1 py-0.5 rounded-md ${
              isWhite
                ? "bg-brand-emerald-500/20 text-brand-emerald-300 border border-brand-emerald-400/30"
                : "bg-emerald-50 text-brand-emerald-600 border border-emerald-200/80"
            }`}
          >
            +
          </span>
        </div>

        {withTagline && (
          <span
            className={`font-medium tracking-wider mt-1 uppercase ${taglineSizes[size]} ${
              isWhite ? "text-slate-400" : "text-slate-400"
            }`}
          >
            Hệ thống Dược phẩm Trực tuyến
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
};

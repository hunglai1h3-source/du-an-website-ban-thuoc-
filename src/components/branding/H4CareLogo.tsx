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
      {/* Abstract 4-part Symbol */}
      <AbstractSymbol size={symbolSizes[size]} withGlow={!isWhite} />

      {/* Brand Wordmark */}
      <div className="flex flex-col">
        <div className="flex items-center tracking-tight leading-none">
          <span
            className={`font-black tracking-wider ${textSizes[size]} ${
              isWhite ? "text-white" : "text-brand-blue-700"
            }`}
          >
            H
          </span>
          <span
            className={`font-black tracking-wider ${textSizes[size]} ${
              isWhite ? "text-brand-cyan-300" : "text-brand-cyan-500"
            }`}
          >
            4
          </span>
          <span
            className={`font-extrabold tracking-tight ${textSizes[size]} ${
              isWhite ? "text-white" : "text-slate-900"
            }`}
          >
            CARE
          </span>
          <span className="ml-0.5 text-brand-emerald-500 font-bold text-base leading-none">
            +
          </span>
        </div>

        {withTagline && (
          <span
            className={`font-medium tracking-wide mt-0.5 uppercase ${taglineSizes[size]} ${
              isWhite ? "text-slate-300" : "text-slate-500"
            }`}
          >
            Nhà thuốc trực tuyến cao cấp
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

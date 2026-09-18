"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "primary" | "cyan" | "emerald" | "amber" | "neutral";
  size?: "sm" | "md";
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "primary",
  size = "md",
  dot = false,
  children,
  className = "",
}) => {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
  };

  const variantStyles = {
    primary: "bg-brand-blue-50 text-brand-blue-700 border border-brand-blue-100/80",
    cyan: "bg-cyan-50 text-cyan-700 border border-cyan-100",
    emerald: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border border-amber-100",
    neutral: "bg-slate-100 text-slate-700 border border-slate-200/60",
  };

  const dotColors = {
    primary: "bg-brand-blue-500",
    cyan: "bg-brand-cyan-500",
    emerald: "bg-brand-emerald-500",
    amber: "bg-amber-500",
    neutral: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full tracking-wide select-none",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              dotColors[variant]
            )}
          />
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              dotColors[variant]
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
};

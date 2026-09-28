"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "elevated" | "flat" | "bordered";
  hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "glass", hoverable = false, children, ...props }, ref) => {
    const variantStyles = {
      glass: "glass-card",
      elevated: "bg-white shadow-medical-lg border border-slate-100",
      flat: "bg-brand-surface-100 border border-slate-200/70",
      bordered: "bg-white border border-slate-200",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl p-5 transition-all duration-300",
          variantStyles[variant],
          hoverable && "hover:-translate-y-1 hover:shadow-card-hover cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

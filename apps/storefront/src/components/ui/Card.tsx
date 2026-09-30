"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "elevated" | "flat" | "bordered";
  hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "bordered", hoverable = false, children, ...props }, ref) => {
    const variantStyles = {
      glass: "bg-white border border-slate-200 shadow-xs",
      elevated: "bg-white shadow-depth-2 border border-slate-200/80",
      flat: "bg-slate-50 border border-slate-200",
      bordered: "bg-white border border-slate-200 shadow-xs",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl p-5 transition-all duration-200",
          variantStyles[variant],
          hoverable && "hover:-translate-y-0.5 hover:shadow-depth-2 hover:border-brand-blue-200 transition-all duration-200 cursor-pointer",
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

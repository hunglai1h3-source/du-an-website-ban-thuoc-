"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "glass" | "emerald";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

    const sizeStyles = {
      sm: "h-9 px-3.5 text-xs gap-1.5",
      md: "h-11 px-5 text-sm gap-2",
      lg: "h-13 px-7 text-base gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-gradient-to-r from-brand-blue-600 via-brand-blue-500 to-brand-cyan-600 text-white shadow-medical hover:shadow-medical-glow hover:brightness-105",
      secondary:
        "bg-brand-blue-50 text-brand-blue-700 hover:bg-brand-blue-100/80 border border-brand-blue-100",
      emerald:
        "bg-gradient-to-r from-brand-emerald-600 to-teal-500 text-white shadow-medical hover:brightness-105",
      outline:
        "border border-slate-200 bg-white/80 text-slate-700 hover:border-brand-blue-300 hover:text-brand-blue-600 hover:bg-brand-blue-50/50",
      ghost:
        "text-slate-600 hover:text-brand-blue-600 hover:bg-slate-100/80",
      glass:
        "bg-white/80 backdrop-blur-md border border-white/60 text-slate-800 hover:bg-white hover:border-brand-cyan-200 shadow-glass",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0 transition-transform group-hover:-translate-x-0.5">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0 transition-transform group-hover:translate-x-0.5">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

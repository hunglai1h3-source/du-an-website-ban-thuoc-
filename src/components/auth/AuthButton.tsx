"use client";

import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: "primary" | "outline" | "secondary";
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const AuthButton = forwardRef<HTMLButtonElement, AuthButtonProps>(
  (
    {
      children,
      isLoading = false,
      loadingText,
      variant = "primary",
      fullWidth = true,
      leftIcon,
      rightIcon,
      className = "",
      disabled,
      type = "submit",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "relative inline-flex items-center justify-center font-bold text-sm sm:text-base rounded-xl transition-all duration-200 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] h-12";

    const variantStyles = {
      primary:
        "bg-gradient-to-r from-brand-blue-600 via-brand-blue-500 to-brand-cyan-600 text-white shadow-medical hover:shadow-medical-glow hover:brightness-[1.03] active:brightness-95",
      outline:
        "border border-slate-200 bg-white text-slate-700 hover:border-brand-blue-300 hover:text-brand-blue-600 hover:bg-brand-blue-50/50 shadow-xs",
      secondary:
        "bg-brand-blue-50 text-brand-blue-700 hover:bg-brand-blue-100/80 border border-brand-blue-100",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${fullWidth ? "w-full" : "w-auto px-6"}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-current" />
            <span>{loadingText || "Đang xử lý..."}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </div>
        )}
      </button>
    );
  }
);

AuthButton.displayName = "AuthButton";

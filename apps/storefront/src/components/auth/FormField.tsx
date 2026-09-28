"use client";

import React, { forwardRef } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  success?: boolean;
  leadingIcon?: React.ReactNode;
  trailingAction?: React.ReactNode;
  hint?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      id,
      error,
      success,
      leadingIcon,
      trailingAction,
      hint,
      className = "",
      required,
      ...props
    },
    ref
  ) => {
    const hasError = Boolean(error);
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    return (
      <div className="w-full space-y-1.5 text-left">
        {/* Label & Optional Hint */}
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className="block text-xs sm:text-sm font-semibold text-slate-800 tracking-tight select-none"
          >
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
          {hint && (
            <span id={hintId} className="text-xs text-slate-400 font-normal select-none">
              {hint}
            </span>
          )}
        </div>

        {/* Input Wrapper */}
        <div className="relative rounded-xl transition-all duration-200">
          {/* Leading Icon */}
          {leadingIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <span className="w-4 h-4 flex items-center justify-center">{leadingIcon}</span>
            </div>
          )}

          {/* Native Input */}
          <input
            ref={ref}
            id={id}
            required={required}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? errorId : hint ? hintId : undefined
            }
            className={`w-full h-11 sm:h-12 bg-white text-sm text-slate-900 placeholder:text-slate-400 rounded-xl border transition-all duration-150 outline-none
              ${leadingIcon ? "pl-10" : "pl-3.5"}
              ${trailingAction || hasError || success ? "pr-10" : "pr-3.5"}
              ${
                hasError
                  ? "border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/15"
                  : success
                  ? "border-emerald-400 bg-emerald-50/20 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/15"
                  : "border-slate-200 hover:border-slate-300 focus:border-brand-blue-500 focus:ring-3 focus:ring-brand-blue-500/15"
              }
              ${className}
            `}
            {...props}
          />

          {/* Trailing Container: Either Custom Action (like Show/Hide) or Status Icon */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {trailingAction ? (
              trailingAction
            ) : hasError ? (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 pointer-events-none" />
            ) : success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 pointer-events-none" />
            ) : null}
          </div>
        </div>

        {/* Error Message with Gentle Alert Transition */}
        {hasError && (
          <p
            id={errorId}
            role="alert"
            className="flex items-center gap-1.5 text-xs text-rose-600 font-medium pt-0.5 animate-fadeIn"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

"use client";

import React from "react";
import { evaluatePasswordStrength } from "@/lib/validation/auth";
import { Check, X } from "lucide-react";

interface PasswordStrengthProps {
  password?: string;
  showChecklist?: boolean;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password = "",
  showChecklist = true,
}) => {
  const result = evaluatePasswordStrength(password);
  const isStarted = password.length > 0;

  return (
    <div className="w-full space-y-2 pt-1 select-none">
      {/* 4 Segmented Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Độ bảo mật mật khẩu:</span>
          <span
            className={`font-semibold ${
              !isStarted
                ? "text-slate-400"
                : result.score <= 1
                ? "text-rose-500"
                : result.score === 2
                ? "text-amber-500"
                : result.score === 3
                ? "text-brand-blue-600"
                : "text-emerald-600"
            }`}
          >
            {isStarted ? result.label : "Chưa nhập"}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
          {[1, 2, 3, 4].map((step) => {
            const isFilled = isStarted && result.score >= step;
            return (
              <div
                key={step}
                className={`h-full rounded-full transition-all duration-300 ${
                  isFilled
                    ? result.color
                    : "bg-slate-200"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Realtime Guidance Checklist (Subtle & Non-aggressive) */}
      {showChecklist && isStarted && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[11px] pt-1 text-slate-500">
          <div className="flex items-center gap-1.5">
            {result.checks.length ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 inline-block" />
            )}
            <span className={result.checks.length ? "text-slate-700 font-medium" : "text-slate-400"}>
              Tối thiểu 8 ký tự
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {result.checks.hasLower ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 inline-block" />
            )}
            <span className={result.checks.hasLower ? "text-slate-700 font-medium" : "text-slate-400"}>
              Chữ thường (a-z)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {result.checks.hasUpper ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 inline-block" />
            )}
            <span className={result.checks.hasUpper ? "text-slate-700 font-medium" : "text-slate-400"}>
              Chữ hoa (A-Z)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {result.checks.hasNumberOrSpecial ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 inline-block" />
            )}
            <span className={result.checks.hasNumberOrSpecial ? "text-slate-700 font-medium" : "text-slate-400"}>
              Số hoặc ký tự đặc biệt
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

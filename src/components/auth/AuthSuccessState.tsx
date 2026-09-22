"use client";

import React from "react";
import Link from "next/link";
import { Check, ArrowRight, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { AuthButton } from "./AuthButton";

interface AuthSuccessStateProps {
  title: string;
  description: string;
  primaryActionText?: string;
  primaryActionHref?: string;
  onPrimaryAction?: () => void;
  secondaryActionText?: string;
  secondaryActionHref?: string;
  onSecondaryAction?: () => void;
  countdownSeconds?: number;
}

export const AuthSuccessState: React.FC<AuthSuccessStateProps> = ({
  title,
  description,
  primaryActionText = "Đăng nhập ngay",
  primaryActionHref = "/login",
  onPrimaryAction,
  secondaryActionText,
  secondaryActionHref,
  onSecondaryAction,
  countdownSeconds,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="text-center py-6 px-2 space-y-6 max-w-md mx-auto"
    >
      {/* Animated Medical Check Circle */}
      <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-xs"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
          >
            <Check className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />
          </motion.div>
        </motion.div>
      </div>

      {/* Narrative */}
      <div className="space-y-2">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {title}
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed font-normal">
          {description}
        </p>
      </div>

      {/* Actions */}
      <div className="pt-2 space-y-3">
        {primaryActionHref ? (
          <Link href={primaryActionHref} className="block w-full">
            <AuthButton rightIcon={<ArrowRight className="w-4 h-4" />}>
              {primaryActionText}
            </AuthButton>
          </Link>
        ) : (
          <AuthButton
            onClick={onPrimaryAction}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {primaryActionText}
          </AuthButton>
        )}

        {secondaryActionText && (
          <div>
            {secondaryActionHref ? (
              <Link
                href={secondaryActionHref}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-blue-600 transition-colors py-2"
              >
                <span>{secondaryActionText}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={onSecondaryAction}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-blue-600 transition-colors py-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{secondaryActionText}</span>
                {countdownSeconds !== undefined && countdownSeconds > 0 && (
                  <span className="text-slate-400 font-normal">({countdownSeconds}s)</span>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

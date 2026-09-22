"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface AuthAlertProps {
  type?: "error" | "warning" | "success" | "info";
  message: string;
  className?: string;
}

export const AuthAlert: React.FC<AuthAlertProps> = ({
  type = "error",
  message,
  className = "",
}) => {
  if (!message) return null;

  const config = {
    error: {
      bg: "bg-rose-50/80 border-rose-200/80 text-rose-800",
      icon: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />,
    },
    warning: {
      bg: "bg-amber-50/80 border-amber-200/80 text-amber-800",
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
    },
    success: {
      bg: "bg-emerald-50/80 border-emerald-200/80 text-emerald-800",
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
    },
    info: {
      bg: "bg-brand-blue-50/80 border-brand-blue-200/80 text-brand-blue-800",
      icon: <Info className="w-4 h-4 text-brand-blue-600 shrink-0 mt-0.5" />,
    },
  };

  const current = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      role="alert"
      className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-xs sm:text-sm font-medium leading-relaxed ${current.bg} ${className}`}
    >
      {current.icon}
      <div className="flex-1">{message}</div>
    </motion.div>
  );
};

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { ForgotPasswordFormState, FormErrorState } from "@/types/auth";
import { isValidIdentifier } from "@/lib/validation/auth";
import { Mail, ArrowLeft, ArrowRight, RotateCcw, ShieldAlert, KeyRound } from "lucide-react";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [formData, setFormData] = useState<ForgotPasswordFormState>({
    identifier: "",
  });

  const [errors, setErrors] = useState<FormErrorState>({});
  const [touched, setTouched] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);
  const [resendCountdown, setResendCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);

  // Countdown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSent && resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isSent && resendCountdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [isSent, resendCountdown]);

  const validate = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "Vui lòng nhập email hoặc số điện thoại đã đăng ký.";
    }
    if (!isValidIdentifier(trimmed)) {
      return "Email hoặc số điện thoại chưa đúng định dạng.";
    }
    return undefined;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData({ identifier: value });

    if (touched) {
      const error = validate(value);
      setErrors({ identifier: error });
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    const error = validate(formData.identifier);
    setErrors({ identifier: error });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    const error = validate(formData.identifier);
    if (error) {
      setErrors({ identifier: error });
      return;
    }

    setIsLoading(true);
    setGeneralError(null);

    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
      setResendCountdown(60);
      setCanResend(false);
    }, 900);
  };

  const handleResend = () => {
    if (!canResend) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setResendCountdown(60);
      setCanResend(false);
    }, 600);
  };

  // Sent State (Interactive confirmation with countdown)
  if (isSent) {
    return (
      <AuthLayout>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="text-center py-6 px-2 space-y-6 max-w-md mx-auto"
        >
          {/* Animated Mail Sent Icon */}
          <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-blue-50 text-brand-blue-600 border border-brand-blue-200/80 flex items-center justify-center shadow-xs">
              <Mail className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse-slow" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Kiểm tra hộp thư của bạn
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Nếu thông tin <strong className="text-slate-800">{formData.identifier}</strong> khớp với tài khoản đã đăng ký trong hệ thống, H4CARE đã gửi hướng dẫn đặt lại mật khẩu.
            </p>
          </div>

          {/* Security Note */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <ShieldAlert className="w-4 h-4 text-brand-blue-600" />
              <span>Lưu ý bảo mật y tế</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Liên kết đặt lại mật khẩu có hiệu lực trong vòng 15 phút. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.
            </p>
          </div>

          {/* Action Row */}
          <div className="space-y-3 pt-2">
            <Link href="/login" className="block w-full">
              <AuthButton rightIcon={<ArrowRight className="w-4 h-4" />}>
                Quay lại Đăng nhập
              </AuthButton>
            </Link>

            <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-500">
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend || isLoading}
                className="inline-flex items-center gap-1.5 hover:text-brand-blue-600 disabled:opacity-50 disabled:hover:text-slate-500 py-2 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Gửi lại hướng dẫn</span>
                {!canResend && <span className="font-normal">({resendCountdown}s)</span>}
              </button>
            </div>

            {/* Quick Demo Shortcut Link to /reset-password for evaluation */}
            <div className="pt-4 border-t border-slate-100">
              <Link
                href="/reset-password"
                className="inline-flex items-center gap-1.5 text-xs text-brand-blue-600 hover:text-brand-blue-700 hover:underline font-medium"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Mô phỏng bấm vào liên kết đặt lại mật khẩu →</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Header Title */}
        <div className="space-y-1.5 text-left">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Quên mật khẩu?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            Nhập email hoặc số điện thoại đã đăng ký để nhận hướng dẫn khôi phục mật khẩu.
          </p>
        </div>

        {generalError && <AuthAlert type="error" message={generalError} />}

        {/* Forgot Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormField
            id="forgot-identifier"
            name="identifier"
            label="Email hoặc số điện thoại"
            placeholder="nhathuoc@h4care.vn hoặc 0901234567"
            value={formData.identifier}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched ? errors.identifier : undefined}
            leadingIcon={<Mail className="w-4 h-4" />}
            autoComplete="username"
            required
          />

          <div className="pt-2">
            <AuthButton
              isLoading={isLoading}
              loadingText="Đang gửi hướng dẫn..."
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Gửi hướng dẫn đặt lại mật khẩu
            </AuthButton>
          </div>
        </form>

        {/* Back to Login Link */}
        <div className="text-center pt-2 select-none">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-brand-blue-600 transition-colors py-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại đăng nhập</span>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

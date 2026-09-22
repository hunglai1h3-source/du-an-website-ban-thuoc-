"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthSuccessState } from "@/components/auth/AuthSuccessState";
import { ResetPasswordFormState, FormErrorState } from "@/types/auth";
import { evaluatePasswordStrength } from "@/lib/validation/auth";
import { ArrowRight, KeyRound, AlertTriangle, RefreshCw } from "lucide-react";

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState<ResetPasswordFormState>({
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrorState>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isExpiredDemo, setIsExpiredDemo] = useState<boolean>(false);

  const validateField = (name: keyof ResetPasswordFormState, value: string, currentVals = formData) => {
    let error: string | undefined = undefined;

    if (name === "newPassword") {
      if (!value) {
        error = "Vui lòng nhập mật khẩu mới.";
      } else if (value.length < 8) {
        error = "Mật khẩu cần tối thiểu 8 ký tự.";
      }
    }

    if (name === "confirmPassword") {
      if (!value) {
        error = "Vui lòng xác nhận mật khẩu mới.";
      } else if (value !== currentVals.newPassword) {
        error = "Mật khẩu xác nhận chưa khớp.";
      }
    }

    return error;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newForm = { ...formData, [name]: value };
    setFormData(newForm);

    if (touched[name]) {
      const error = validateField(name as keyof ResetPasswordFormState, value, newForm);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }

    if (name === "newPassword" && touched.confirmPassword && formData.confirmPassword) {
      const confirmError = validateField("confirmPassword", formData.confirmPassword, newForm);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }

    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name as keyof ResetPasswordFormState, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ newPassword: true, confirmPassword: true });

    const newPasswordError = validateField("newPassword", formData.newPassword);
    const confirmPasswordError = validateField("confirmPassword", formData.confirmPassword);

    if (newPasswordError || confirmPasswordError) {
      setErrors({
        newPassword: newPasswordError,
        confirmPassword: confirmPasswordError,
      });
      return;
    }

    const strength = evaluatePasswordStrength(formData.newPassword);
    if (strength.score < 2) {
      setErrors((prev) => ({
        ...prev,
        newPassword: "Mật khẩu quá yếu. Vui lòng bổ sung thêm chữ hoa, số hoặc ký tự đặc biệt.",
      }));
      return;
    }

    setIsLoading(true);
    setGeneralError(null);

    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 900);
  };

  const isMatched =
    Boolean(formData.newPassword) &&
    Boolean(formData.confirmPassword) &&
    formData.newPassword === formData.confirmPassword;

  // Expired Link Fallback State
  if (isExpiredDemo) {
    return (
      <AuthLayout>
        <div className="w-full max-w-md mx-auto text-center py-6 px-2 space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Liên kết đã hết hạn
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Vì lý do an toàn bảo mật y tế, liên kết đặt lại mật khẩu chỉ có giá trị trong 15 phút và đã quá thời hạn sử dụng.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link href="/forgot-password" className="block w-full">
              <AuthButton rightIcon={<RefreshCw className="w-4 h-4" />}>
                Yêu cầu gửi liên kết mới
              </AuthButton>
            </Link>

            <button
              type="button"
              onClick={() => setIsExpiredDemo(false)}
              className="text-xs font-semibold text-slate-500 hover:text-brand-blue-600 transition-colors py-2"
            >
              ← Quay lại thử nghiệm nhập mật khẩu mới
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Success State
  if (isSuccess) {
    return (
      <AuthLayout>
        <AuthSuccessState
          title="Mật khẩu đã được cập nhật"
          description="Mật khẩu tài khoản H4CARE của bạn đã được thay đổi thành công. Bạn có thể sử dụng mật khẩu mới này để đăng nhập ngay bây giờ."
          primaryActionText="Đăng nhập ngay"
          primaryActionHref="/login"
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Header Title */}
        <div className="space-y-1.5 text-left">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-blue-700 bg-brand-blue-50 px-2.5 py-0.5 rounded-full border border-brand-blue-100">
            <KeyRound className="w-3.5 h-3.5 text-brand-blue-600" />
            Bảo Mật Tài Khoản
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Đặt lại mật khẩu mới
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            Thiết lập mật khẩu an toàn và dễ nhớ để bảo vệ tài khoản H4CARE của bạn.
          </p>
        </div>

        {generalError && <AuthAlert type="error" message={generalError} />}

        {/* Reset Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <PasswordField
              id="reset-newPassword"
              name="newPassword"
              label="Mật khẩu mới"
              placeholder="Tối thiểu 8 ký tự, có chữ hoa, số"
              value={formData.newPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.newPassword ? errors.newPassword : undefined}
              autoComplete="new-password"
              required
            />
            <PasswordStrength password={formData.newPassword} showChecklist={true} />
          </div>

          <div className="space-y-1">
            <PasswordField
              id="reset-confirmPassword"
              name="confirmPassword"
              label="Xác nhận mật khẩu mới"
              placeholder="Nhập lại chính xác mật khẩu mới"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.confirmPassword ? errors.confirmPassword : undefined}
              success={isMatched}
              autoComplete="new-password"
              required
            />
            {isMatched && (
              <p className="text-[11px] text-emerald-600 font-medium select-none pl-1">
                ✓ Mật khẩu xác nhận khớp hoàn toàn
              </p>
            )}
          </div>

          <div className="pt-3">
            <AuthButton
              isLoading={isLoading}
              loadingText="Đang cập nhật mật khẩu..."
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Cập nhật mật khẩu
            </AuthButton>
          </div>
        </form>

        {/* Demo Toggle for Link Expired Edge Case */}
        <div className="pt-4 border-t border-slate-100 text-center select-none">
          <button
            type="button"
            onClick={() => setIsExpiredDemo(true)}
            className="text-[11px] text-slate-400 hover:text-amber-600 hover:underline transition-colors"
          >
            [Mô phỏng trường hợp liên kết token hết hạn]
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

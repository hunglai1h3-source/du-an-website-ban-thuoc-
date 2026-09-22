"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { PasswordField } from "@/components/auth/PasswordField";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { SocialLoginButton } from "@/components/auth/SocialLoginButton";
import { AuthSuccessState } from "@/components/auth/AuthSuccessState";
import { LoginFormState, FormErrorState } from "@/types/auth";
import { isValidIdentifier } from "@/lib/validation/auth";
import { Mail, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormState>({
    identifier: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState<FormErrorState>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Validate on blur or submit
  const validateField = (name: keyof LoginFormState, value: string) => {
    let error: string | undefined = undefined;

    if (name === "identifier") {
      const trimmed = value.trim();
      if (!trimmed) {
        error = "Vui lòng nhập email hoặc số điện thoại.";
      } else if (!isValidIdentifier(trimmed)) {
        error = "Email hoặc số điện thoại chưa đúng định dạng.";
      }
    }

    if (name === "password") {
      if (!value) {
        error = "Vui lòng nhập mật khẩu.";
      } else if (value.length < 6) {
        error = "Mật khẩu tối thiểu 6 ký tự.";
      }
    }

    return error;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when typing if already touched
    if (touched[name]) {
      const error = validateField(name as keyof LoginFormState, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name as keyof LoginFormState, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all as touched
    setTouched({ identifier: true, password: true });

    const identifierError = validateField("identifier", formData.identifier);
    const passwordError = validateField("password", formData.password);

    if (identifierError || passwordError) {
      setErrors({
        identifier: identifierError,
        password: passwordError,
      });
      return;
    }

    // Submit Simulation
    setIsLoading(true);
    setGeneralError(null);

    setTimeout(() => {
      setIsLoading(false);
      // Demo test trigger: if user enters "error@example.com" or "0000000000", show non-aggressive auth error
      if (formData.identifier === "error@example.com" || formData.identifier === "0000000000") {
        setGeneralError("Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại email/số điện thoại hoặc mật khẩu.");
      } else {
        setIsSuccess(true);
      }
    }, 900);
  };

  if (isSuccess) {
    return (
      <AuthLayout>
        <AuthSuccessState
          title="Đăng nhập thành công"
          description={`Chào mừng bạn quay trở lại H4CARE! Hệ sinh thái dược phẩm và hỗ trợ sức khỏe cá nhân đã sẵn sàng.`}
          primaryActionText="Đi đến Trang chủ H4CARE"
          primaryActionHref="/"
          secondaryActionText="Đăng xuất / Đổi tài khoản khác"
          onSecondaryAction={() => {
            setIsSuccess(false);
            setFormData({ identifier: "", password: "", rememberMe: false });
          }}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Header Title */}
        <div className="space-y-1.5 text-left">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Đăng nhập tài khoản
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            Truy cập để quản lý đơn thuốc, theo dõi sức khỏe và nhận tư vấn chuyên môn.
          </p>
        </div>

        {/* Global Non-aggressive Error Alert */}
        {generalError && <AuthAlert type="error" message={generalError} />}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email / Phone Field */}
          <FormField
            id="login-identifier"
            name="identifier"
            label="Email hoặc số điện thoại"
            placeholder="nhathuoc@h4care.vn hoặc 0901234567"
            value={formData.identifier}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.identifier ? errors.identifier : undefined}
            leadingIcon={<Mail className="w-4 h-4" />}
            autoComplete="username"
            required
          />

          {/* Password Field */}
          <div className="space-y-1">
            <PasswordField
              id="login-password"
              name="password"
              label="Mật khẩu"
              placeholder="Nhập mật khẩu tài khoản"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.password ? errors.password : undefined}
              autoComplete="current-password"
              required
            />
          </div>

          {/* Remember Me & Forgot Password Row */}
          <div className="flex items-center justify-between text-xs sm:text-sm pt-1 select-none">
            <label className="inline-flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500 focus:ring-offset-0 transition-colors cursor-pointer"
              />
              <span className="text-slate-600 group-hover:text-slate-900 transition-colors text-xs font-medium">
                Ghi nhớ đăng nhập
              </span>
            </label>

            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700 hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 rounded"
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* Primary Submit Button */}
          <div className="pt-2">
            <AuthButton
              isLoading={isLoading}
              loadingText="Đang đăng nhập..."
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Đăng nhập
            </AuthButton>
          </div>
        </form>

        {/* Social Prototype Login */}
        <SocialLoginButton dividerText="hoặc đăng nhập bằng" />

        {/* Switch to Register Footer */}
        <div className="text-center pt-2 select-none">
          <p className="text-xs sm:text-sm text-slate-500">
            Chưa có tài khoản H4CARE?{" "}
            <Link
              href="/register"
              className="font-bold text-brand-blue-600 hover:text-brand-blue-700 hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 rounded"
            >
              Tạo tài khoản ngay
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

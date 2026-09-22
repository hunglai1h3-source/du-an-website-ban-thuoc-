"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthAlert } from "@/components/auth/AuthAlert";
import { AuthSuccessState } from "@/components/auth/AuthSuccessState";
import { RegisterFormState, FormErrorState } from "@/types/auth";
import { isValidEmail, isValidVietnamesePhone, evaluatePasswordStrength } from "@/lib/validation/auth";
import { User, Phone, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormState>({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [errors, setErrors] = useState<FormErrorState>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const validateField = (name: keyof RegisterFormState, value: any, currentValues = formData) => {
    let error: string | undefined = undefined;

    if (name === "fullName") {
      const trimmed = (value || "").trim();
      if (!trimmed) {
        error = "Vui lòng nhập họ và tên của bạn.";
      } else if (trimmed.length < 2) {
        error = "Họ và tên tối thiểu 2 ký tự.";
      }
    }

    if (name === "phone") {
      const trimmed = (value || "").trim();
      if (!trimmed) {
        error = "Vui lòng nhập số điện thoại.";
      } else if (!isValidVietnamesePhone(trimmed)) {
        error = "Số điện thoại Việt Nam chưa hợp lệ (gồm 10 số, ví dụ 0901234567).";
      }
    }

    if (name === "email") {
      const trimmed = (value || "").trim();
      if (!trimmed) {
        error = "Vui lòng nhập địa chỉ email.";
      } else if (!isValidEmail(trimmed)) {
        error = "Địa chỉ email chưa đúng định dạng (ví dụ user@domain.com).";
      }
    }

    if (name === "password") {
      if (!value) {
        error = "Vui lòng thiết lập mật khẩu.";
      } else if (value.length < 8) {
        error = "Mật khẩu cần tối thiểu 8 ký tự.";
      }
    }

    if (name === "confirmPassword") {
      if (!value) {
        error = "Vui lòng nhập lại mật khẩu.";
      } else if (value !== currentValues.password) {
        error = "Mật khẩu xác nhận chưa khớp.";
      }
    }

    if (name === "agreeTerms") {
      if (!value) {
        error = "Vui lòng đồng ý với điều khoản sử dụng để tiếp tục.";
      }
    }

    return error;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const finalVal = type === "checkbox" ? checked : value;

    const newFormData = {
      ...formData,
      [name]: finalVal,
    };
    setFormData(newFormData);

    if (touched[name]) {
      const error = validateField(name as keyof RegisterFormState, finalVal, newFormData);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }

    // Also update confirmPassword check if password is being edited
    if (name === "password" && touched.confirmPassword && formData.confirmPassword) {
      const confirmError = validateField("confirmPassword", formData.confirmPassword, newFormData);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }

    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const finalVal = type === "checkbox" ? checked : value;

    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name as keyof RegisterFormState, finalVal);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      fullName: true,
      phone: true,
      email: true,
      password: true,
      confirmPassword: true,
      agreeTerms: true,
    });

    const fullNameError = validateField("fullName", formData.fullName);
    const phoneError = validateField("phone", formData.phone);
    const emailError = validateField("email", formData.email);
    const passwordError = validateField("password", formData.password);
    const confirmPasswordError = validateField("confirmPassword", formData.confirmPassword);
    const agreeTermsError = validateField("agreeTerms", formData.agreeTerms);

    const hasAnyError =
      fullNameError ||
      phoneError ||
      emailError ||
      passwordError ||
      confirmPasswordError ||
      agreeTermsError;

    if (hasAnyError) {
      setErrors({
        fullName: fullNameError,
        phone: phoneError,
        email: emailError,
        password: passwordError,
        confirmPassword: confirmPasswordError,
        agreeTerms: agreeTermsError,
      });
      return;
    }

    // Check strength
    const strength = evaluatePasswordStrength(formData.password);
    if (strength.score < 2) {
      setErrors((prev) => ({
        ...prev,
        password: "Mật khẩu quá yếu. Vui lòng bổ sung thêm chữ hoa, số hoặc ký tự đặc biệt.",
      }));
      return;
    }

    // Submit Simulation
    setIsLoading(true);
    setGeneralError(null);

    setTimeout(() => {
      setIsLoading(false);
      // Demo test trigger:
      if (formData.phone === "0900000000" || formData.email === "existing@example.com") {
        setGeneralError("Số điện thoại hoặc email này đã được đăng ký trong hệ thống.");
      } else {
        setIsSuccess(true);
      }
    }, 1000);
  };

  const isPasswordMatched =
    Boolean(formData.password) &&
    Boolean(formData.confirmPassword) &&
    formData.password === formData.confirmPassword;

  if (isSuccess) {
    return (
      <AuthLayout>
        <AuthSuccessState
          title="Tạo tài khoản thành công!"
          description={`Tài khoản H4CARE của ${formData.fullName} đã sẵn sàng. Bạn có thể đăng nhập ngay để trải nghiệm các dịch vụ chăm sóc sức khỏe và mua thuốc trực tuyến.`}
          primaryActionText="Đăng nhập ngay"
          primaryActionHref="/login"
          secondaryActionText="Quay lại chỉnh sửa thông tin"
          onSecondaryAction={() => setIsSuccess(false)}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-lg mx-auto space-y-5">
        {/* Header Title */}
        <div className="space-y-1.5 text-left">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-blue-700 bg-brand-blue-50 px-2.5 py-0.5 rounded-full border border-brand-blue-100">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-blue-600" />
            Hội Viên H4CARE
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tạo tài khoản mới
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            Gia nhập cộng đồng chăm sóc sức khỏe chủ động và theo dõi đơn thuốc chuẩn GPP.
          </p>
        </div>

        {/* Global Error Banner */}
        {generalError && <AuthAlert type="error" message={generalError} />}

        {/* Register Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Full Name */}
          <FormField
            id="register-fullName"
            name="fullName"
            label="Họ và tên"
            placeholder="Ví dụ: Nguyễn Văn An"
            value={formData.fullName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.fullName ? errors.fullName : undefined}
            leadingIcon={<User className="w-4 h-4" />}
            autoComplete="name"
            required
          />

          {/* Phone & Email Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField
              id="register-phone"
              name="phone"
              type="tel"
              label="Số điện thoại"
              placeholder="0901234567"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.phone ? errors.phone : undefined}
              leadingIcon={<Phone className="w-4 h-4" />}
              autoComplete="tel"
              required
            />

            <FormField
              id="register-email"
              name="email"
              type="email"
              label="Địa chỉ email"
              placeholder="nguyenvanan@gmail.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email ? errors.email : undefined}
              leadingIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />
          </div>

          {/* Password Field + Password Strength Indicator */}
          <div className="space-y-2">
            <PasswordField
              id="register-password"
              name="password"
              label="Mật khẩu"
              placeholder="Tối thiểu 8 ký tự, có chữ hoa, số"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.password ? errors.password : undefined}
              autoComplete="new-password"
              required
            />
            <PasswordStrength password={formData.password} showChecklist={true} />
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1">
            <PasswordField
              id="register-confirmPassword"
              name="confirmPassword"
              label="Nhập lại mật khẩu"
              placeholder="Nhập lại chính xác mật khẩu trên"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.confirmPassword ? errors.confirmPassword : undefined}
              success={isPasswordMatched}
              autoComplete="new-password"
              required
            />
            {isPasswordMatched && (
              <p className="text-[11px] text-emerald-600 font-medium select-none pl-1">
                ✓ Mật khẩu nhập lại khớp hoàn toàn
              </p>
            )}
          </div>

          {/* Terms and Conditions Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer group select-none">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500 focus:ring-offset-0 transition-colors cursor-pointer shrink-0"
              />
              <span className="text-xs text-slate-600 leading-normal">
                Tôi đồng ý với{" "}
                <span className="font-semibold text-brand-blue-700 hover:underline">
                  Điều khoản sử dụng
                </span>{" "}
                và{" "}
                <span className="font-semibold text-brand-blue-700 hover:underline">
                  Chính sách bảo mật dữ liệu y tế H4CARE
                </span>
                .
              </span>
            </label>
            {touched.agreeTerms && errors.agreeTerms && (
              <p className="text-xs text-rose-600 font-medium pt-1 animate-fadeIn">
                {errors.agreeTerms}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <AuthButton
              isLoading={isLoading}
              loadingText="Đang tạo tài khoản..."
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Tạo tài khoản
            </AuthButton>
          </div>
        </form>

        {/* Footer: Switch to Login */}
        <div className="text-center pt-2 select-none border-t border-slate-100">
          <p className="text-xs sm:text-sm text-slate-500">
            Đã có tài khoản H4CARE?{" "}
            <Link
              href="/login"
              className="font-bold text-brand-blue-600 hover:text-brand-blue-700 hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 rounded"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

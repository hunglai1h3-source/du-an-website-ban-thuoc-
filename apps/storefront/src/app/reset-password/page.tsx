"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { H4CareLogo } from "@/components/branding/H4CareLogo";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  KeyRound,
} from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const target = searchParams.get("target") || "";

  const [password, setPassword] = useState<string>("H4careNew@2026");
  const [confirmPassword, setConfirmPassword] = useState<string>("H4careNew@2026");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage("Mật khẩu mới tối thiểu 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 800);
    }, 450);
  };

  const getStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return Math.min(score, 4);
  };

  const strength = getStrength(password);
  const strengthLabels = ["Rất yếu", "Yếu", "Trung bình", "Khá mạnh", "Rất an toàn"];
  const strengthColors = [
    "bg-slate-300",
    "bg-rose-500",
    "bg-amber-500",
    "bg-sky-500",
    "bg-emerald-500",
  ];
  const strengthTextColors = [
    "text-slate-500",
    "text-rose-600",
    "text-amber-600",
    "text-sky-600",
    "text-emerald-600",
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-brand-cyan-100 selection:text-brand-blue-900">
      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
        <H4CareLogo size="md" withTagline={true} />
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:text-brand-blue-600 hover:border-brand-blue-300 hover:bg-slate-50 shadow-xs transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-brand-blue-600" />
          <span>Về trang đăng nhập</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8 flex items-center justify-center flex-1">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl border border-slate-200 shadow-depth-2 overflow-hidden">
          
          {/* Left Side: Medical Trust Brand Panel */}
          <div className="hidden lg:block lg:col-span-5 relative">
            <AuthBrandPanel />
          </div>

          {/* Right Side: Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center bg-white">
            <div className="w-full max-w-md mx-auto">
              
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-brand-emerald-700 border border-emerald-200/80 text-[11px] font-bold mb-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald-600" />
                  <span>Bảo mật tài khoản PharmaTrust</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Tạo mật khẩu mới
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {target ? `Thiết lập mật khẩu bảo mật mới cho tài khoản: ${target}` : "Vui lòng nhập mật khẩu mới để hoàn tất khôi phục tài khoản."}
                </p>
              </div>

              {/* Alerts */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 font-medium leading-relaxed"
                  >
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">{errorMessage}</div>
                  </motion.div>
                )}

                {isSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 font-medium leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">Mật khẩu đã được cập nhật thành công! Đang chuyển hướng về trang đăng nhập...</div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới..."
                      required
                      className="w-full px-3.5 py-2.5 pl-10 pr-10 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-blue-600 focus:ring-4 focus:ring-brand-blue-100 transition-all font-medium"
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Lock className="w-4 h-4 text-brand-blue-600" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Strength Bar */}
                  {password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 grid grid-cols-4 gap-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        {[1, 2, 3, 4].map((lvl) => (
                          <div
                            key={lvl}
                            className={`h-full transition-colors ${
                              strength >= lvl ? strengthColors[strength] : "bg-transparent"
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-[11px] font-bold ${strengthTextColors[strength]}`}>
                        {strengthLabels[strength]}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới..."
                      required
                      className="w-full px-3.5 py-2.5 pl-10 pr-10 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-blue-600 focus:ring-4 focus:ring-brand-blue-100 transition-all font-medium"
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Lock className="w-4 h-4 text-brand-blue-600" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isSuccess}
                  className="w-full py-3 px-4 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold text-sm shadow-depth-1 hover:shadow-depth-2 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu mật khẩu...</span>
                    </>
                  ) : (
                    <>
                      <span>Cập nhật mật khẩu & Đăng nhập</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-slate-600">
                <Link
                  href="/login"
                  className="font-bold text-brand-blue-600 hover:text-brand-blue-800 hover:underline"
                >
                  Quay lại đăng nhập
                </Link>
              </div>

            </div>
          </div>
        </div>
      </main>

      <footer className="w-full text-center py-4 text-[11px] text-slate-400 select-none">
        <span>Hệ thống Quản lý Dữ liệu Thuốc & Bán lẻ Dược phẩm PharmaTrust • Định hướng chuẩn GPP & GSP</span>
      </footer>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-slate-400">Đang tải...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

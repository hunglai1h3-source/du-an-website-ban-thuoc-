"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth/auth-context";
import { H4CareLogo } from "@/components/branding/H4CareLogo";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import {
  ArrowLeft,
  Smartphone,
  Mail,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  KeyRound,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { sendPhoneOtp } = useAuth();

  const [identifier, setIdentifier] = useState<string>("0901234567");
  const [step, setStep] = useState<"input" | "otp">("input");
  const [otpValues, setOtpValues] = useState<string[]>(["8", "4", "2", "6", "9", "1"]);
  const [countdown, setCountdown] = useState<number>(60);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "otp" && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage("Vui lòng nhập số điện thoại hoặc email đã đăng ký.");
      return;
    }

    setIsSubmitting(true);
    await sendPhoneOtp(identifier.trim());
    setIsSubmitting(false);

    setStep("otp");
    setCountdown(60);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const otpCode = otpValues.join("");
    if (otpCode.length < 6) {
      setErrorMessage("Vui lòng nhập đủ 6 chữ số mã OTP.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        router.push(`/reset-password?target=${encodeURIComponent(identifier.trim())}`);
      }, 700);
    }, 450);
  };

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
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-brand-blue-700 border border-sky-200/80 text-[11px] font-bold mb-3">
                  <KeyRound className="w-3.5 h-3.5 text-brand-blue-600" />
                  <span>Khôi phục tài khoản an toàn</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Quên mật khẩu?
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Nhập số điện thoại hoặc email đã đăng ký. Hệ thống sẽ gửi mã xác thực OTP bảo mật để đặt lại mật khẩu.
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
                    <div className="flex-1">Mã xác thực chính xác! Đang chuyển hướng sang trang đặt lại mật khẩu...</div>
                  </motion.div>
                )}
              </AnimatePresence>

              {step === "input" ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Số điện thoại hoặc Email
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Ví dụ: 0901 234 567 hoặc email..."
                        required
                        className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-blue-600 focus:ring-4 focus:ring-brand-blue-100 transition-all font-medium"
                      />
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        {identifier.includes("@") ? (
                          <Mail className="w-4 h-4 text-brand-blue-600" />
                        ) : (
                          <Smartphone className="w-4 h-4 text-brand-blue-600" />
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold text-sm shadow-depth-1 hover:shadow-depth-2 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang gửi mã OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Tiếp tục nhận mã OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center mb-4">
                    <span className="text-xs text-slate-500">Mã OTP 6 số đã gửi tới</span>
                    <p className="text-sm font-bold text-slate-900">{identifier}</p>
                  </div>

                  <div className="flex justify-center gap-2">
                    {otpValues.map((val, idx) => (
                      <input
                        key={idx}
                        id={`otp-input-${idx}`}
                        type="text"
                        maxLength={1}
                        value={val}
                        onChange={(e) => {
                          const newVals = [...otpValues];
                          newVals[idx] = e.target.value.slice(-1);
                          setOtpValues(newVals);
                          if (e.target.value && idx < 5) {
                            document.getElementById(`otp-input-${idx + 1}`)?.focus();
                          }
                        }}
                        className="w-10 h-12 text-center text-lg font-bold rounded-xl border border-slate-200 text-slate-900 bg-white focus:outline-none focus:border-brand-blue-600 focus:ring-4 focus:ring-brand-blue-100 transition-all"
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("input")}
                      className="text-slate-600 hover:text-brand-blue-600 font-medium"
                    >
                      Đổi số / email
                    </button>
                    <span>
                      {countdown > 0 ? (
                        `Gửi lại sau ${countdown}s`
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setCountdown(60);
                            sendPhoneOtp(identifier);
                          }}
                          className="text-brand-blue-600 font-bold hover:underline"
                        >
                          Gửi lại mã
                        </button>
                      )}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || isSuccess}
                    className="w-full py-3 px-4 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold text-sm shadow-depth-1 hover:shadow-depth-2 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang xác thực mã...</span>
                      </>
                    ) : (
                      <>
                        <span>Xác nhận & Đặt lại mật khẩu</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              <div className="mt-6 text-center text-xs text-slate-600">
                Nhớ mật khẩu tài khoản?{" "}
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

"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth/auth-context";
import { redirectToAdminPortal } from "@/lib/auth/admin-redirect";
import { H4CareLogo } from "@/components/branding/H4CareLogo";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  KeyRound,
  RotateCcw,
  Loader2,
  ArrowRight,
  UserCheck,
} from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/account";

  const { user, isAuthenticated, loginWithPassword, loginWithPhone, sendPhoneOtp } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.isAdmin) {
        redirectToAdminPortal();
      } else {
        router.push(redirectUrl);
      }
    }
  }, [isAuthenticated, user, router, redirectUrl]);

  // ================= FORM STATE =================
  const [identifier, setIdentifier] = useState<string>("0901234567");
  const [password, setPassword] = useState<string>("H4carePass@2026");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // OTP mode toggle
  const [useOtpMode, setUseOtpMode] = useState<boolean>(false);
  const [otpStep, setOtpStep] = useState<"phone" | "verify">("phone");
  const [otpValues, setOtpValues] = useState<string[]>(["8", "4", "2", "6", "9", "1"]);
  const [countdown, setCountdown] = useState<number>(60);

  // Status feedback
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Recent accounts list
  const [recentAccounts, setRecentAccounts] = useState<Array<{ fullName: string; identifier: string; role: string }>>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("h4care_recent_accounts");
      if (stored) {
        setRecentAccounts(JSON.parse(stored));
      } else {
        setRecentAccounts([
          { fullName: "Nguyễn Văn An", identifier: "0901234567", role: "Hội viên Thân thiết" },
          { fullName: "Trần Thị Mai", identifier: "0909888999", role: "Hội viên VIP" },
          { fullName: "Quản trị viên", identifier: "admin@pharmatrust.vn", role: "ADMIN" },
        ]);
      }
    } catch (e) {
      console.warn("Failed to load recent accounts", e);
    }
  }, []);

  const saveRecentAccount = (name: string, id: string, role: string) => {
    try {
      const updated = [
        { fullName: name, identifier: id, role },
        ...recentAccounts.filter((a) => a.identifier !== id),
      ].slice(0, 4);
      setRecentAccounts(updated);
      localStorage.setItem("h4care_recent_accounts", JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to save recent account", e);
    }
  };

  // OTP Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (useOtpMode && otpStep === "verify" && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [useOtpMode, otpStep, countdown]);

  // ================= SUBMIT HANDLERS =================
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage("Vui lòng nhập Email hoặc Số điện thoại.");
      return;
    }
    if (!password) {
      setErrorMessage("Vui lòng nhập mật khẩu tài khoản.");
      return;
    }

    setIsSubmitting(true);
    const result = await loginWithPassword(identifier.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
      if (result.user) {
        saveRecentAccount(result.user.fullName, identifier.trim(), result.user.role);
      }
      const isTargetAdmin = result.user?.isAdmin;
      if (isTargetAdmin) {
        setSuccessMessage("Đăng nhập Quản trị viên thành công! Đang chuyển hướng vào Cổng Quản Trị...");
        setTimeout(() => {
          redirectToAdminPortal();
        }, 500);
      } else {
        setSuccessMessage(`Chào mừng trở lại, ${result.user?.fullName}!`);
        setTimeout(() => {
          router.push(redirectUrl);
        }, 750);
      }
    } else {
      setErrorMessage(result.error || "Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại.");
    }
  };

  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = identifier.replace(/\D/g, "");
    if (cleanPhone.length < 9) {
      setErrorMessage("Vui lòng nhập số điện thoại hợp lệ (9 - 10 chữ số).");
      return;
    }

    setIsSubmitting(true);
    const res = await sendPhoneOtp(cleanPhone);
    setIsSubmitting(false);

    if (res.success) {
      setOtpStep("verify");
      setCountdown(60);
    } else {
      setErrorMessage(res.error || "Gửi OTP không thành công.");
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const otpCode = otpValues.join("");
    if (otpCode.length < 6) {
      setErrorMessage("Vui lòng nhập đầy đủ 6 chữ số mã xác thực OTP.");
      return;
    }

    setIsSubmitting(true);
    const cleanPhone = identifier.replace(/\D/g, "");
    const res = await loginWithPhone(cleanPhone, otpCode);
    setIsSubmitting(false);

    if (res.success) {
      setIsSuccess(true);
      const isTargetAdmin = res.user?.isAdmin;
      if (isTargetAdmin) {
        setSuccessMessage("Đăng nhập Quản trị viên thành công! Đang chuyển hướng vào Cổng Quản Trị...");
        setTimeout(() => {
          redirectToAdminPortal();
        }, 500);
      } else {
        setSuccessMessage(`Chào mừng trở lại, ${res.user?.fullName}!`);
        setTimeout(() => {
          router.push(redirectUrl);
        }, 750);
      }
    } else {
      setErrorMessage(res.error || "Mã OTP không chính xác.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-brand-cyan-100 selection:text-brand-blue-900">
      {/* Top Brand Navigation Header */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
        <H4CareLogo size="md" withTagline={true} />
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:text-brand-blue-600 hover:border-brand-blue-300 hover:bg-slate-50 shadow-xs transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-brand-blue-600" />
          <span>Về trang chủ</span>
        </Link>
      </header>

      {/* Main Authentication Container */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8 flex items-center justify-center flex-1">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl border border-slate-200 shadow-depth-2 overflow-hidden">
          
          {/* Left Side: Medical Trust Brand Panel (Desktop Only) */}
          <div className="hidden lg:block lg:col-span-5 relative">
            <AuthBrandPanel />
          </div>

          {/* Right Side: Clean Medical Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center bg-white">
            <div className="w-full max-w-md mx-auto">
              
              {/* Header Title & Brand Badge */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-brand-emerald-700 border border-emerald-200/80 text-[11px] font-bold mb-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald-600" />
                  <span>Nền tảng Y tế & Dược phẩm PharmaTrust</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Đăng nhập tài khoản
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Tra cứu dữ liệu thuốc chuẩn xác, theo dõi đơn hàng và đồng hành cùng Dược sĩ.
                </p>
              </div>

              {/* Notification Alerts */}
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

                {isSuccess && successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 font-medium leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">{successMessage}</div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mode Toggle: Password vs Phone OTP */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 border border-slate-200/80 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setUseOtpMode(false);
                    setErrorMessage(null);
                  }}
                  className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    !useOtpMode
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-brand-blue-600" />
                  <span>Dùng Mật khẩu</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseOtpMode(true);
                    setOtpStep("phone");
                    setErrorMessage(null);
                  }}
                  className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    useOtpMode
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-brand-blue-600" />
                  <span>Mã OTP di động</span>
                </button>
              </div>

              {/* MODE 1: Standard Password Authentication */}
              {!useOtpMode && (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email hoặc Số điện thoại
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Nhập email hoặc số điện thoại..."
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

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700">Mật khẩu</label>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-brand-blue-600 hover:text-brand-blue-800 font-semibold transition-colors"
                      >
                        Quên mật khẩu?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhập mật khẩu của bạn..."
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
                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-brand-blue-600 border-slate-300 focus:ring-brand-blue-500"
                      />
                      <span>Ghi nhớ đăng nhập trên thiết bị này</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || isSuccess}
                    className="w-full py-3 px-4 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold text-sm shadow-depth-1 hover:shadow-depth-2 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang xác thực thông tin...</span>
                      </>
                    ) : (
                      <>
                        <span>Đăng nhập</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* MODE 2: OTP Fast Verification */}
              {useOtpMode && (
                <div>
                  {otpStep === "phone" ? (
                    <form onSubmit={handleOtpRequest} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Số điện thoại nhận mã OTP
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="Ví dụ: 0901234567"
                            required
                            className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-blue-600 focus:ring-4 focus:ring-brand-blue-100 transition-all font-medium"
                          />
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <Smartphone className="w-4 h-4 text-brand-blue-600" />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold text-sm shadow-depth-1 hover:shadow-depth-2 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Đang gửi mã OTP...</span>
                          </>
                        ) : (
                          <>
                            <span>Gửi mã xác thực OTP</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleOtpVerify} className="space-y-4">
                      <div className="text-center mb-4">
                        <span className="text-xs text-slate-500">Mã xác thực 6 số đã gửi tới</span>
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
                          onClick={() => setOtpStep("phone")}
                          className="text-slate-600 hover:text-brand-blue-600 font-medium"
                        >
                          Đổi số điện thoại
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
                        className="w-full py-3 px-4 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold text-sm shadow-depth-1 hover:shadow-depth-2 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Đang kiểm tra mã OTP...</span>
                          </>
                        ) : (
                          <>
                            <span>Xác nhận & Đăng nhập</span>
                            <CheckCircle2 className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Quick Test Switcher - Clean Medical Pills */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Thử nghiệm nhanh vai trò
                  </span>
                  <span className="text-[10px] text-slate-400">1-Click điền mẫu</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier("admin@pharmatrust.vn");
                      setPassword("Admin@123456");
                      setUseOtpMode(false);
                      setErrorMessage(null);
                    }}
                    className="p-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition-all text-center"
                    title="Đăng nhập tài khoản Quản trị viên (Chuyển tới Admin Portal)"
                  >
                    🛡️ Quản trị viên
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier("0901234567");
                      setPassword("H4carePass@2026");
                      setUseOtpMode(false);
                      setErrorMessage(null);
                    }}
                    className="p-2 rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-100 text-sky-700 text-[11px] font-bold transition-all text-center"
                    title="Khách hàng Nguyễn Văn An"
                  >
                    👤 Khách (An)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier("0909888999");
                      setPassword("H4carePass@2026");
                      setUseOtpMode(false);
                      setErrorMessage(null);
                    }}
                    className="p-2 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition-all text-center"
                    title="Hội viên VIP Trần Thị Mai"
                  >
                    ⭐ Khách (Mai VIP)
                  </button>
                </div>
                <p className="text-[10.5px] text-slate-500 mt-2 leading-relaxed">
                  * Tài khoản <strong>Quản trị viên</strong> sẽ tự động chuyển hướng vào Cổng Quản Trị Hệ Thống. Tài khoản <strong>Khách hàng</strong> sẽ vào trang Quản lý Đơn thuốc & Hội viên.
                </p>
              </div>

              {/* Bottom Registration Link */}
              <div className="mt-6 text-center text-xs text-slate-600">
                Chưa có tài khoản thành viên?{" "}
                <Link
                  href="/register"
                  className="font-bold text-brand-blue-600 hover:text-brand-blue-800 hover:underline"
                >
                  Đăng ký ngay
                </Link>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Global Academic & Healthcare Trust Subtext */}
      <footer className="w-full text-center py-4 text-[11px] text-slate-400 select-none">
        <span>Hệ thống Quản lý Dữ liệu Thuốc & Bán lẻ Dược phẩm PharmaTrust • Định hướng chuẩn GPP & GSP</span>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-slate-400">Đang khởi tạo PharmaTrust...</div>}>
      <LoginContent />
    </Suspense>
  );
}

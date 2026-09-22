"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { ArrowLeft, ArrowRight, ShieldCheck, PhoneCall, Lock, Sparkles, CheckCircle2 } from "lucide-react";
import { H4CareLogo } from "@/components/branding/H4CareLogo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/account";

  const { user, isAuthenticated, loginWithPhone, loginWithPassword, sendPhoneOtp } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, router, redirectUrl]);

  // View state: 'phone' | 'otp' | 'password'
  const [viewState, setViewState] = useState<"phone" | "otp" | "password">("phone");

  // Phone flow state
  const [phone, setPhone] = useState<string>("0901234567");
  const [otpValues, setOtpValues] = useState<string[]>(["8", "4", "2", "6", "9", "1"]);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password flow state
  const [identifier, setIdentifier] = useState<string>("khachhang@h4care.vn");
  const [password, setPassword] = useState<string>("H4carePass@2026");

  // Feedback & Loading
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(60);

  // Countdown timer for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (viewState === "otp" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [viewState, timer]);

  // Handle phone submission -> send OTP
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 9) {
      setErrorMsg("Vui lòng nhập số điện thoại hợp lệ (9 - 10 chữ số).");
      return;
    }

    setIsSubmitting(true);
    const res = await sendPhoneOtp(cleanPhone);
    setIsSubmitting(false);

    if (res.success) {
      setViewState("otp");
      setTimer(60);
      setSuccessMsg(`Mã xác thực OTP đã được gửi tới số ${cleanPhone}`);
    } else {
      setErrorMsg(res.error || "Gửi OTP không thành công.");
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = digit;
    setOtpValues(newOtp);

    // Auto focus next input
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Submit OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const otp = otpValues.join("");
    if (otp.length < 6) {
      setErrorMsg("Vui lòng nhập đủ 6 chữ số mã OTP.");
      return;
    }

    setIsSubmitting(true);
    const res = await loginWithPhone(phone, otp);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg("Xác thực thành công! Đang chuyển hướng...");
      setTimeout(() => {
        router.push(redirectUrl);
      }, 600);
    } else {
      setErrorMsg(res.error || "Mã OTP không chính xác.");
    }
  };

  // Submit Password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    setIsSubmitting(true);
    const res = await loginWithPassword(identifier, password);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg("Đăng nhập thành công! Đang chuyển hướng...");
      setTimeout(() => {
        router.push(redirectUrl);
      }, 600);
    } else {
      setErrorMsg(res.error || "Tài khoản hoặc mật khẩu không chính xác.");
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (timer > 0) return;
    setErrorMsg(null);
    await sendPhoneOtp(phone);
    setTimer(60);
    setSuccessMsg("Mã OTP mới đã được gửi lại!");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f4f6f9] text-slate-900">
      
      {/* ================= TOP LONG CHAU TRUST BAR ================= */}
      <header className="bg-[#1250dc] text-white shadow-xs sticky top-0 z-30">
        {/* Micro Bar */}
        <div className="border-b border-white/10 text-xs py-1.5 px-4 hidden sm:block">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-[11px] text-white/90">
            <div className="flex items-center gap-4">
              <span>Cam kết 100% thuốc chính hãng</span>
              <span>•</span>
              <span>Chuẩn GPP Bộ Y Tế</span>
              <span>•</span>
              <span>Bảo quản GSP giao nhanh 2 giờ</span>
            </div>
            <div>
              <a href="tel:18006868" className="hover:underline font-bold flex items-center gap-1.5">
                <PhoneCall className="w-3 h-3 text-cyan-300" />
                <span>Tư vấn Dược sĩ miễn cước: 1800 6868</span>
              </a>
            </div>
          </div>
        </div>

        {/* Main Brand Bar */}
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white text-[#1250dc] font-black text-xl flex items-center justify-center shadow-xs">
              H4
            </div>
            <div>
              <span className="text-lg font-black tracking-tight block leading-none">H4CARE</span>
              <span className="text-[10px] tracking-wider text-cyan-200 uppercase font-semibold">NHÀ THUỐC TRỰC TUYẾN</span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về trang chủ</span>
          </Link>
        </div>
      </header>


      {/* ================= MAIN AUTH CARD (LONG CHAU STYLE) ================= */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 sm:p-6 flex items-center justify-center">
        <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          
          {/* Card Top Icon */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <ShieldCheck className="w-7 h-7 text-[#1250dc]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Đăng nhập hoặc Đăng ký
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Nhập số điện thoại để mua thuốc, tích điểm & nhận tư vấn Dược sĩ
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ================= STEP 1: ENTER PHONE NUMBER ================= */}
          {viewState === "phone" && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Số điện thoại của bạn</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-slate-600 border-r border-slate-200 pr-2 flex items-center gap-1 select-none">
                    <span>🇻🇳</span> +84
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ví dụ: 0912 345 678"
                    className="w-full h-12 pl-20 pr-4 text-sm font-semibold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc] focus:ring-3 focus:ring-blue-500/15 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Long Chau Blue Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-[#1250dc] hover:bg-[#0d42b8] text-white text-sm font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <span>{isSubmitting ? "Đang gửi OTP..." : "Tiếp tục"}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center pt-2">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-[11px] text-slate-400 font-medium uppercase tracking-wider">hoặc</span>
              </div>

              {/* Secondary Login Options */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setViewState("password");
                  }}
                  className="w-full h-11 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Đăng nhập bằng Mật khẩu</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      loginWithPhone("0901234567", "842691");
                    }}
                    className="h-10 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      loginWithPhone("0901234567", "842691");
                    }}
                    className="h-10 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 text-xs font-bold text-blue-800 flex items-center justify-center gap-2 transition-colors"
                  >
                    <span className="w-4 h-4 rounded bg-[#0068ff] text-white text-[9px] font-black flex items-center justify-center">Z</span>
                    <span>Zalo</span>
                  </button>
                </div>
              </div>

              {/* Long Chau Legal Note */}
              <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-2">
                Bằng việc tiếp tục, bạn đồng ý với <Link href="/terms" className="text-[#1250dc] hover:underline font-medium">Điều khoản dịch vụ</Link> và <Link href="/privacy" className="text-[#1250dc] hover:underline font-medium">Chính sách bảo mật đơn thuốc</Link> của H4CARE.
              </p>
            </form>
          )}

          {/* ================= STEP 2: ENTER OTP CODE ================= */}
          {viewState === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setViewState("phone");
                  }}
                  className="text-xs font-bold text-[#1250dc] hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Đổi số điện thoại</span>
                </button>
                <span className="text-[11px] text-slate-400">Bước 2/2</span>
              </div>

              <div className="p-3.5 bg-blue-50/80 border border-blue-100 rounded-2xl text-xs text-blue-900 leading-relaxed">
                Mã xác thực 6 chữ số đã được gửi qua tin nhắn SMS tới số <strong className="text-[#1250dc] font-extrabold">{phone}</strong>.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Nhập mã OTP</label>
                <div className="grid grid-cols-6 gap-2">
                  {otpValues.map((val, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-full h-12 text-center text-lg font-bold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc] focus:ring-3 focus:ring-blue-500/15"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-[#1250dc] hover:bg-[#0d42b8] text-white text-sm font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <span>{isSubmitting ? "Đang kiểm tra..." : "Xác nhận & Đăng nhập"}</span>
              </button>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={timer > 0}
                  className={`font-bold ${timer === 0 ? "text-[#1250dc] hover:underline cursor-pointer" : "text-slate-400 cursor-not-allowed"}`}
                >
                  Gửi lại mã OTP
                </button>
                <span>
                  {timer > 0 ? (
                    <>Hiệu lực: <strong className="text-slate-700">{timer}s</strong></>
                  ) : (
                    <span className="text-amber-600 font-medium">Hết hạn</span>
                  )}
                </span>
              </div>
            </form>
          )}

          {/* ================= STEP 3: LOGIN WITH PASSWORD ================= */}
          {viewState === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setViewState("phone");
                  }}
                  className="text-xs font-bold text-[#1250dc] hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Dùng Số điện thoại (OTP)</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Số điện thoại hoặc Email</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full h-12 px-4 text-sm font-semibold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc] focus:ring-3 focus:ring-blue-500/15"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">Mật khẩu</label>
                  <Link href="/forgot-password" className="text-xs font-bold text-[#1250dc] hover:underline">
                    Quên mật khẩu?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 px-4 text-sm font-semibold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc] focus:ring-3 focus:ring-blue-500/15"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-[#1250dc] hover:bg-[#0d42b8] text-white text-sm font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <span>{isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

        </div>

        {/* 3 Long Chau Trust Badges underneath */}
        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-500">
          <div className="p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="font-bold text-slate-900 block text-xs">100% Chính hãng</span>
            <span>Thuốc chuẩn GPP</span>
          </div>
          <div className="p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="font-bold text-slate-900 block text-xs">Giao trong 2h</span>
            <span>Bảo quản chuẩn GSP</span>
          </div>
          <div className="p-2.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="font-bold text-slate-900 block text-xs">Dược sĩ 1800 6868</span>
            <span>Tư vấn miễn cước</span>
          </div>
        </div>

      </main>

      {/* ================= BOTTOM FOOTER ================= */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-bold text-slate-800">HỆ THỐNG NHÀ THUỐC H4CARE</span>
            <span className="hidden sm:inline"> — </span>
            <span className="block sm:inline text-[11px]">Định hướng theo chuẩn FPT Long Châu & Bộ Y Tế</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="font-bold text-[#1250dc]">Tổng đài miễn cước: 1800 6868</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f4f6f9] text-slate-600 text-sm">
          Đang tải trang đăng nhập H4CARE...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAuth } from "@/lib/auth/auth-context";
import { LiquidMetalButton } from "@/components/auth/LiquidMetalButton";
import { SpatialLoginBackground } from "@/components/auth/SpatialLoginBackground";
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
  Sparkles,
  KeyRound,
  RotateCcw,
} from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/account";
  const shouldReduceMotion = useReducedMotion();

  const { isAuthenticated, loginWithPassword, loginWithPhone, sendPhoneOtp } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, router, redirectUrl]);

  // ================= FORM STATE =================
  const [identifier, setIdentifier] = useState<string>("0901234567");
  const [password, setPassword] = useState<string>("H4carePass@2026");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Quick OTP sub-mode (optional toggle for mobile users)
  const [useOtpMode, setUseOtpMode] = useState<boolean>(false);
  const [otpStep, setOtpStep] = useState<"phone" | "verify">("phone");
  const [otpValues, setOtpValues] = useState<string[]>(["8", "4", "2", "6", "9", "1"]);
  const [countdown, setCountdown] = useState<number>(60);

  // Status feedback
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Input focus indicators
  const [focusedField, setFocusedField] = useState<"identifier" | "password" | "otp" | null>(null);

  // Desktop Mouse Parallax state (2-6px)
  const [mouseParallax, setMouseParallax] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  useEffect(() => {
    // Detect touch device to disable parallax
    if (typeof window !== "undefined") {
      setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isTouchDevice || shouldReduceMotion) return;
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    // Normalized parallax between -4 and +4 pixels
    const px = ((clientX - centerX) / centerX) * 4;
    const py = ((clientY - centerY) / centerY) * 4;
    setMouseParallax({ x: px, y: py });
  };

  // OTP Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (useOtpMode && otpStep === "verify" && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [useOtpMode, otpStep, countdown]);

  // Detect input type: Phone or Email
  const isPhone = /^[0-9+ \-]+$/.test(identifier.trim());

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
      // Smooth visual confirmation sequence before page redirect
      setTimeout(() => {
        router.push(redirectUrl);
      }, 750);
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
      setTimeout(() => {
        router.push(redirectUrl);
      }, 750);
    } else {
      setErrorMessage(res.error || "Mã OTP không chính xác.");
    }
  };

  // Motion Variants for Opening Sequence (0.8s - 1.4s)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200"
    >
      {/* ================= SPATIAL MULTI-LAYER BACKGROUND ================= */}
      <SpatialLoginBackground mouseParallax={mouseParallax} />

      {/* ================= TOP NAVIGATION BAR ================= */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-7 flex items-center justify-between">
        {/* H4CARE Animated Logo */}
        <Link
          href="/"
          className="group flex items-center gap-3 focus:outline-none"
          title="Trở về trang chủ H4CARE"
        >
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-blue-800 p-0.5 shadow-[0_0_20px_rgba(34,211,238,0.35)] transition-transform duration-300 group-hover:scale-105">
            <div className="w-full h-full rounded-[14px] bg-[#071329] flex items-center justify-center font-black text-lg sm:text-xl tracking-tighter text-white">
              <span className="bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                H4
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                H4CARE
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <span className="text-[10px] tracking-widest text-cyan-300/70 font-semibold uppercase hidden sm:block">
              HỆ THỐNG Y TẾ SỐ
            </span>
          </div>
        </Link>

        {/* Minimal Back to Home Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/40 backdrop-blur-md transition-all duration-200 active:scale-95 shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
          <span>Về trang chủ</span>
        </Link>
      </header>

      {/* ================= MAIN INTERACTION STAGE ================= */}
      <main className="relative z-20 flex-1 w-full max-w-md mx-auto px-4 sm:px-6 flex flex-col justify-center py-6 sm:py-10">
        
        {/* PARALLAX CARD WRAPPER */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          style={{
            transform: shouldReduceMotion
              ? undefined
              : `translate3d(${mouseParallax.x * -3}px, ${mouseParallax.y * -3}px, 0)`,
          }}
          className="relative w-full"
        >
          {/* Outer Specular Edge Glow */}
          <div className="absolute -inset-0.5 rounded-[32px] bg-gradient-to-b from-cyan-400/30 via-blue-600/10 to-transparent blur-md opacity-70 pointer-events-none" />

          {/* Core Architectural Glass Slab Card */}
          <div className="relative rounded-[28px] sm:rounded-[32px] bg-[#081224]/85 border border-white/[0.12] backdrop-blur-2xl p-6 sm:p-9 shadow-[0_20px_60px_-15px_rgba(0,18,50,0.8)] overflow-hidden">
            
            {/* Top Prismatic Sheen Highlight Line */}
            <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

            {/* HEADER TYPOGRAPHY */}
            <motion.div variants={itemVariants} className="text-center mb-6 sm:mb-8">
              {/* Trust Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/30 text-[11px] font-bold text-cyan-300 mb-3 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cổng kết nối hồ sơ y tế bảo mật</span>
              </div>

              {/* Headline */}
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Chào mừng trở lại.
              </h1>

              {/* Subtext */}
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                Đăng nhập để tiếp tục hành trình cùng{" "}
                <span className="text-cyan-300 font-semibold">H4CARE</span>.
              </p>
            </motion.div>

            {/* ALERT / ERROR NOTIFICATION */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="mb-5 overflow-hidden"
                >
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ================= PRIMARY LOGIN FORM ================= */}
            {!useOtpMode ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-4 sm:space-y-5">
                
                {/* 1. EMAIL OR PHONE INPUT */}
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-300">
                      Email hoặc Số điện thoại
                    </label>
                    {identifier && (
                      <span className="text-[10px] font-bold text-cyan-400/90 uppercase tracking-wider">
                        {isPhone ? "Điện thoại" : "Tài khoản Email"}
                      </span>
                    )}
                  </div>

                  <div
                    className={`relative rounded-2xl bg-white/[0.03] border transition-all duration-200 flex items-center ${
                      focusedField === "identifier"
                        ? "border-cyan-400/80 bg-cyan-950/20 shadow-[0_0_16px_rgba(34,211,238,0.18)]"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="pl-4 pr-2 text-slate-400">
                      {isPhone ? (
                        <Smartphone
                          className={`w-4 h-4 transition-colors ${
                            focusedField === "identifier" ? "text-cyan-400" : ""
                          }`}
                        />
                      ) : (
                        <Mail
                          className={`w-4 h-4 transition-colors ${
                            focusedField === "identifier" ? "text-cyan-400" : ""
                          }`}
                        />
                      )}
                    </div>

                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      onFocus={() => setFocusedField("identifier")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="0901 234 567 hoặc ten@email.com"
                      className="w-full h-12 pr-4 bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none"
                      required
                    />
                  </div>
                </motion.div>

                {/* 2. PASSWORD INPUT */}
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-300">Mật khẩu</label>
                    <Link
                      href="/forgot-password"
                      className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline transition-colors"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>

                  <div
                    className={`relative rounded-2xl bg-white/[0.03] border transition-all duration-200 flex items-center ${
                      focusedField === "password"
                        ? "border-cyan-400/80 bg-cyan-950/20 shadow-[0_0_16px_rgba(34,211,238,0.18)]"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="pl-4 pr-2 text-slate-400">
                      <Lock
                        className={`w-4 h-4 transition-colors ${
                          focusedField === "password" ? "text-cyan-400" : ""
                        }`}
                      />
                    </div>

                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••••••"
                      className="w-full h-12 pr-11 bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-white p-1 focus:outline-none transition-colors"
                      title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* 3. REMEMBER ME & TEST ACCOUNT HINT */}
                <motion.div
                  variants={itemVariants}
                  className="flex items-center justify-between text-xs pt-0.5"
                >
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-white/5 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-cyan-500"
                    />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>

                  {/* Demo test account helper */}
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier("0901234567");
                      setPassword("H4carePass@2026");
                    }}
                    className="text-[11px] font-semibold text-cyan-400/80 hover:text-cyan-300 hover:underline"
                  >
                    Điền tài khoản mẫu
                  </button>
                </motion.div>

                {/* 4. SIGNATURE LIQUID METAL CTA BUTTON */}
                <motion.div variants={itemVariants} className="pt-2">
                  <LiquidMetalButton
                    type="submit"
                    isLoading={isSubmitting}
                    isSuccess={isSuccess}
                  >
                    Đăng nhập H4CARE
                  </LiquidMetalButton>
                </motion.div>

                {/* 5. TOGGLE FAST PHONE OTP LOGIN */}
                <motion.div variants={itemVariants} className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setUseOtpMode(true);
                      setOtpStep("phone");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Hoặc đăng nhập nhanh qua mã OTP di động</span>
                  </button>
                </motion.div>
              </form>
            ) : (
              /* ================= OTP SUB-MODE FORM ================= */
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setUseOtpMode(false);
                    }}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Dùng Mật khẩu thông thường</span>
                  </button>
                  <span className="text-[11px] font-bold text-slate-400">
                    {otpStep === "phone" ? "Bước 1/2" : "Bước 2/2"}
                  </span>
                </div>

                {otpStep === "phone" ? (
                  <form onSubmit={handleOtpRequest} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Số điện thoại nhận mã OTP
                      </label>
                      <div className="relative rounded-2xl bg-white/[0.03] border border-cyan-400/40 p-1 flex items-center">
                        <span className="pl-3 pr-2 text-xs font-bold text-cyan-300 select-none border-r border-white/10">
                          🇻🇳 +84
                        </span>
                        <input
                          type="tel"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="0901 234 567"
                          className="w-full h-11 px-3 bg-transparent text-sm font-bold text-white focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <LiquidMetalButton type="submit" isLoading={isSubmitting}>
                      Nhận mã OTP bảo mật
                    </LiquidMetalButton>
                  </form>
                ) : (
                  <form onSubmit={handleOtpVerify} className="space-y-4">
                    <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 text-xs text-cyan-200">
                      Mã xác thực gồm 6 chữ số đã được gửi tới SĐT{" "}
                      <strong className="text-white font-bold">{identifier}</strong>.
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-semibold text-slate-300">Nhập 6 số OTP</label>
                        <button
                          type="button"
                          onClick={() => setOtpValues(["8", "4", "2", "6", "9", "1"])}
                          className="text-[11px] font-bold text-cyan-400 hover:underline"
                        >
                          Dán mã mẫu (842691)
                        </button>
                      </div>

                      <div className="grid grid-cols-6 gap-2">
                        {otpValues.map((val, idx) => (
                          <input
                            key={idx}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={val}
                            onChange={(e) => {
                              const next = [...otpValues];
                              next[idx] = e.target.value.slice(-1);
                              setOtpValues(next);
                            }}
                            className="w-full h-12 rounded-xl bg-white/[0.04] border border-white/15 focus:border-cyan-400 text-center text-lg font-black text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                          />
                        ))}
                      </div>
                    </div>

                    <LiquidMetalButton
                      type="submit"
                      isLoading={isSubmitting}
                      isSuccess={isSuccess}
                    >
                      Xác nhận đăng nhập
                    </LiquidMetalButton>
                  </form>
                )}
              </div>
            )}

            {/* ================= BOTTOM REGISTER LINK ================= */}
            <motion.div
              variants={itemVariants}
              className="mt-6 pt-5 border-t border-white/[0.08] text-center text-xs text-slate-400"
            >
              Chưa có tài khoản H4CARE?{" "}
              <Link
                href="/register"
                className="font-extrabold text-cyan-300 hover:text-cyan-200 hover:underline transition-colors"
              >
                Đăng ký ngay
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* ================= CLINICAL FOOTER ================= */}
      <footer className="relative z-20 w-full py-4 text-center text-[11px] text-slate-500">
        <p>
          H4CARE • “Chăm sóc sức khỏe, bắt đầu từ sự thấu hiểu.” • Bản quyền thuộc H4CARE
        </p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050b18] flex items-center justify-center text-cyan-400">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

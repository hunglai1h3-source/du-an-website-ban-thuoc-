"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAuth } from "@/lib/auth/auth-context";
import { SettigationNavTabs, SettigationNavTabItem } from "@/components/auth/SettigationNavTabs";
import { SpatialLoginBackground } from "@/components/auth/SpatialLoginBackground";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  Sparkles,
  Loader2,
  Check,
  KeyRound,
  RotateCcw,
} from "lucide-react";

const AUTH_TABS: SettigationNavTabItem[] = [
  {
    id: "password",
    label: "Mật khẩu",
    icon: <Lock className="w-3.5 h-3.5" />,
  },
  {
    id: "otp",
    label: "Mã OTP (SĐT)",
    icon: <Smartphone className="w-3.5 h-3.5" />,
  },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/account";
  const shouldReduceMotion = useReducedMotion();

  const { isAuthenticated, loginWithPassword, loginWithPhone, sendPhoneOtp } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, router, redirectUrl]);

  // Tab State
  const [activeTab, setActiveTab] = useState<string>("password");
  const [slideDirection, setSlideDirection] = useState<number>(1);

  // Form Fields
  const [identifier, setIdentifier] = useState<string>("0901234567");
  const [password, setPassword] = useState<string>("H4carePass@2026");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // OTP Fields
  const [otpPhone, setOtpPhone] = useState<string>("0901234567");
  const [otpFormattedPhone, setOtpFormattedPhone] = useState<string>("0901 234 567");
  const [otpCarrier, setOtpCarrier] = useState<string>("MobiFone");
  const [otpChannel, setOtpChannel] = useState<"zalo" | "sms">("zalo");
  const [otpStep, setOtpStep] = useState<"phone" | "verify">("phone");
  const [otpValues, setOtpValues] = useState<string[]>(["8", "4", "2", "6", "9", "1"]);
  const [countdown, setCountdown] = useState<number>(60);

  // Status feedback
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Desktop Mouse Parallax
  const [mouseParallax, setMouseParallax] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isTouchDevice || shouldReduceMotion) return;
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const px = ((clientX - centerX) / centerX) * 4;
    const py = ((clientY - centerY) / centerY) * 4;
    setMouseParallax({ x: px, y: py });
  };

  // OTP Countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeTab === "otp" && otpStep === "verify" && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [activeTab, otpStep, countdown]);

  // Phone Formatter
  const formatPhoneString = (inputVal: string) => {
    let val = inputVal.replace(/\D/g, "");
    if (val.length > 10) val = val.substring(0, 10);

    let formatted = "";
    if (val.length > 0) formatted += val.substring(0, 4);
    if (val.length > 4) formatted += " " + val.substring(4, 7);
    if (val.length > 7) formatted += " " + val.substring(7, 10);

    let detectedCarrier = "Việt Nam (+84)";
    if (val.startsWith("090") || val.startsWith("093") || val.startsWith("070") || val.startsWith("079")) {
      detectedCarrier = "MobiFone";
    } else if (val.startsWith("098") || val.startsWith("097") || val.startsWith("086") || val.startsWith("03")) {
      detectedCarrier = "Viettel";
    } else if (val.startsWith("091") || val.startsWith("094") || val.startsWith("088")) {
      detectedCarrier = "VinaPhone";
    }

    return { raw: val, formatted, carrier: detectedCarrier };
  };

  const isPhone = /^[0-9+ \-]+$/.test(identifier.trim());

  // Tab switch handler
  const handleTabChange = (newTabId: string, direction: number) => {
    setErrorMessage(null);
    setSlideDirection(direction);
    setActiveTab(newTabId);
  };

  // Submit Password Login
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
      setTimeout(() => {
        router.push(redirectUrl);
      }, 750);
    } else {
      setErrorMessage(result.error || "Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại.");
    }
  };

  // Submit OTP Request
  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (otpPhone.length < 9) {
      setErrorMessage("Vui lòng nhập số điện thoại hợp lệ (9 - 10 chữ số).");
      return;
    }

    setIsSubmitting(true);
    const res = await sendPhoneOtp(otpPhone);
    setIsSubmitting(false);

    if (res.success) {
      setOtpStep("verify");
      setCountdown(60);
    } else {
      setErrorMessage(res.error || "Gửi OTP không thành công.");
    }
  };

  // Submit OTP Verification
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const otpCode = otpValues.join("");
    if (otpCode.length < 6) {
      setErrorMessage("Vui lòng nhập đủ 6 chữ số mã OTP.");
      return;
    }

    setIsSubmitting(true);
    const res = await loginWithPhone(otpPhone, otpCode);
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

  // Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.09, delayChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  // Directional Content Transition (Settigation Style)
  const tabContentVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 32 : -32,
      opacity: 0,
      filter: "blur(4px)",
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -32 : 32,
      opacity: 0,
      filter: "blur(4px)",
      transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
    }),
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200"
    >
      {/* Background */}
      <SpatialLoginBackground mouseParallax={mouseParallax} />

      {/* Top Header */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-7 flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-3 focus:outline-none" title="Trở về trang chủ H4CARE">
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-blue-800 p-0.5 shadow-[0_0_20px_rgba(34,211,238,0.35)] transition-transform duration-300 group-hover:scale-105">
            <div className="w-full h-full rounded-[14px] bg-[#071329] flex items-center justify-center font-black text-lg sm:text-xl tracking-tighter text-white">
              <span className="bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                H4
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white">H4CARE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <span className="text-[10px] tracking-widest text-cyan-300/70 font-semibold uppercase hidden sm:block">
              HỆ THỐNG Y TẾ SỐ
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/40 backdrop-blur-md transition-all duration-200 active:scale-95 shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
          <span>Về trang chủ</span>
        </Link>
      </header>

      {/* Main Interaction Stage */}
      <main className="relative z-20 flex-1 w-full max-w-md mx-auto px-4 sm:px-6 flex flex-col justify-center py-6 sm:py-10">
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
          <div className="absolute -inset-0.5 rounded-[32px] bg-gradient-to-b from-cyan-400/30 via-blue-600/10 to-transparent blur-md opacity-70 pointer-events-none" />

          {/* Architectural Glass Slab */}
          <div className="relative rounded-[28px] sm:rounded-[32px] bg-[#081224]/85 border border-white/[0.12] backdrop-blur-2xl p-6 sm:p-9 shadow-[0_20px_60px_-15px_rgba(0,18,50,0.8)] overflow-hidden">
            <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

            {/* Typography */}
            <motion.div variants={itemVariants} className="text-center mb-5 sm:mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/30 text-[11px] font-bold text-cyan-300 mb-3 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cổng kết nối hồ sơ y tế bảo mật</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Chào mừng trở lại.
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                Đăng nhập để tiếp tục hành trình cùng{" "}
                <span className="text-cyan-300 font-semibold">H4CARE</span>.
              </p>
            </motion.div>

            {/* SETTIGATION SIGNATURE NAVIGATION TABS CAPSULE */}
            <motion.div variants={itemVariants} className="mb-6">
              <SettigationNavTabs
                tabs={AUTH_TABS}
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </motion.div>

            {/* Error Notification */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* DIRECTIONAL TAB CONTENT SLIDER */}
            <div className="relative overflow-hidden">
              <AnimatePresence custom={slideDirection} mode="wait">
                {activeTab === "password" ? (
                  /* ================= TAB 1: PASSWORD LOGIN ================= */
                  <motion.form
                    key="tab-password"
                    custom={slideDirection}
                    variants={tabContentVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    onSubmit={handlePasswordSubmit}
                    className="space-y-4"
                  >
                    {/* Identifier */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-semibold text-slate-300">
                          Email hoặc Số điện thoại
                        </label>
                        {identifier && (
                          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
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
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
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
                          className="absolute right-3.5 text-slate-400 hover:text-white p-1"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Remember me & test account shortcut */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 bg-white/5 accent-cyan-500 cursor-pointer"
                        />
                        <span>Ghi nhớ đăng nhập</span>
                      </label>

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
                    </div>

                    {/* CTA FLUID SPRING BUTTON */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting || isSuccess}
                        className={`relative w-full h-[52px] rounded-full overflow-hidden flex items-center justify-center font-extrabold text-sm sm:text-base text-white tracking-wide transition-all duration-300 focus:outline-none active:scale-[0.985] cursor-pointer shadow-depth-3 ${
                          isSuccess
                            ? "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 shadow-[0_0_24px_rgba(16,185,129,0.4)]"
                            : "bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-700 hover:brightness-110 shadow-[0_0_24px_rgba(6,182,212,0.35)]"
                        }`}
                      >
                        {/* Specular Highlight Sheen */}
                        <div className="absolute top-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

                        {isSubmitting ? (
                          <div className="flex items-center gap-2 text-cyan-100">
                            <Loader2 className="w-5 h-5 animate-spin text-cyan-200" />
                            <span>Đang xác thực bảo mật...</span>
                          </div>
                        ) : isSuccess ? (
                          <div className="flex items-center gap-2 text-emerald-100">
                            <div className="w-5 h-5 rounded-full bg-white text-emerald-600 flex items-center justify-center font-black">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                            <span>Đăng nhập thành công</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
                            <span>Đăng nhập H4CARE</span>
                            <ArrowRight className="w-4 h-4 text-cyan-200 transition-transform duration-200 group-hover:translate-x-1" />
                          </div>
                        )}
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  /* ================= TAB 2: OTP PHONE LOGIN ================= */
                  <motion.div
                    key="tab-otp"
                    custom={slideDirection}
                    variants={tabContentVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="space-y-4"
                  >
                    {otpStep === "phone" ? (
                      <form onSubmit={handleOtpRequest} className="space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <label className="font-semibold text-slate-300">
                              Số điện thoại nhận mã OTP
                            </label>
                            <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded uppercase">
                              {otpCarrier}
                            </span>
                          </div>

                          <div
                            className={`relative rounded-2xl bg-white/[0.03] border transition-all duration-200 flex items-center ${
                              focusedField === "otpPhone"
                                ? "border-cyan-400/80 bg-cyan-950/20 shadow-[0_0_16px_rgba(34,211,238,0.18)]"
                                : "border-white/10 hover:border-white/20"
                            }`}
                          >
                            <span className="pl-4 pr-2 text-xs font-bold text-cyan-300 select-none border-r border-white/10">
                              🇻🇳 +84
                            </span>
                            <input
                              type="tel"
                              value={otpFormattedPhone}
                              onChange={(e) => {
                                const res = formatPhoneString(e.target.value);
                                setOtpPhone(res.raw);
                                setOtpFormattedPhone(res.formatted);
                                setOtpCarrier(res.carrier);
                              }}
                              onFocus={() => setFocusedField("otpPhone")}
                              onBlur={() => setFocusedField(null)}
                              placeholder="0901 234 567"
                              className="w-full h-12 px-3 bg-transparent text-sm font-semibold text-white focus:outline-none"
                              required
                            />
                          </div>
                        </div>

                        {/* Channel selector */}
                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                          <button
                            type="button"
                            onClick={() => setOtpChannel("zalo")}
                            className={`p-2.5 rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              otpChannel === "zalo"
                                ? "bg-cyan-950/80 border-cyan-400/60 text-cyan-300"
                                : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-white"
                            }`}
                          >
                            <span className="w-4 h-4 rounded bg-[#0068ff] text-white text-[9px] font-black flex items-center justify-center">Z</span>
                            <span>Zalo ZNS (1s)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setOtpChannel("sms")}
                            className={`p-2.5 rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              otpChannel === "sms"
                                ? "bg-cyan-950/80 border-cyan-400/60 text-cyan-300"
                                : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-white"
                            }`}
                          >
                            <span>Tin nhắn SMS</span>
                          </button>
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="relative w-full h-[52px] rounded-full overflow-hidden flex items-center justify-center font-extrabold text-sm sm:text-base text-white tracking-wide bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-700 hover:brightness-110 shadow-[0_0_24px_rgba(6,182,212,0.35)] transition-all duration-300 focus:outline-none active:scale-[0.985] cursor-pointer"
                          >
                            <div className="absolute top-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                            {isSubmitting ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Đang gửi mã OTP...</span>
                              </div>
                            ) : (
                              <span>Tiếp tục bằng mã OTP</span>
                            )}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleOtpVerify} className="space-y-4">
                        <div className="flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={() => setOtpStep("phone")}
                            className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Đổi số điện thoại</span>
                          </button>
                          <span className="text-slate-400 font-bold">Bước 2/2</span>
                        </div>

                        <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 text-xs text-cyan-200">
                          Mã xác thực gồm 6 chữ số đã gửi qua{" "}
                          <strong>{otpChannel === "zalo" ? "Zalo ZNS" : "Tin nhắn SMS"}</strong> tới số{" "}
                          <strong className="text-white font-bold">{otpFormattedPhone}</strong>.
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

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={isSubmitting || isSuccess}
                            className={`relative w-full h-[52px] rounded-full overflow-hidden flex items-center justify-center font-extrabold text-sm sm:text-base text-white tracking-wide transition-all duration-300 focus:outline-none active:scale-[0.985] cursor-pointer shadow-depth-3 ${
                              isSuccess
                                ? "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 shadow-[0_0_24px_rgba(16,185,129,0.4)]"
                                : "bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-700 hover:brightness-110 shadow-[0_0_24px_rgba(6,182,212,0.35)]"
                            }`}
                          >
                            <div className="absolute top-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                            {isSubmitting ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Đang kiểm tra OTP...</span>
                              </div>
                            ) : isSuccess ? (
                              <div className="flex items-center gap-2 text-emerald-100">
                                <div className="w-5 h-5 rounded-full bg-white text-emerald-600 flex items-center justify-center font-black">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                                <span>Xác thực thành công</span>
                              </div>
                            ) : (
                              <span>Xác nhận & Đăng nhập</span>
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Register Link */}
            <motion.div
              variants={itemVariants}
              className="mt-6 pt-5 border-t border-white/[0.08] text-center text-xs text-slate-400"
            >
              Chưa có tài khoản H4CARE?{" "}
              <Link
                href="/register"
                className="font-extrabold text-cyan-300 hover:text-cyan-200 hover:underline transition-colors ml-1"
              >
                Đăng ký ngay
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </main>

      <footer className="relative z-20 w-full py-4 text-center text-[11px] text-slate-500">
        <p>H4CARE • “Chăm sóc sức khỏe, bắt đầu từ sự thấu hiểu.” • Bản quyền thuộc H4CARE</p>
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

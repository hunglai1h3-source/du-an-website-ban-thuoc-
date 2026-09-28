"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAuth } from "@/lib/auth/auth-context";
import { LiquidMetalButton } from "@/components/auth/LiquidMetalButton";
import { SpatialLoginBackground } from "@/components/auth/SpatialLoginBackground";
import {
  ArrowLeft,
  KeyRound,
  Smartphone,
  Mail,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { sendPhoneOtp } = useAuth();

  const [identifier, setIdentifier] = useState<string>("0901234567");
  const [step, setStep] = useState<"input" | "otp">("input");
  const [otpValues, setOtpValues] = useState<string[]>(["8", "4", "2", "6", "9", "1"]);
  const [countdown, setCountdown] = useState<number>(60);

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

  const isPhone = /^[0-9+ \-]+$/.test(identifier.trim());

  // Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
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

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200"
    >
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
              KHÔI PHỤC TÀI KHOẢN
            </span>
          </div>
        </Link>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/40 backdrop-blur-md transition-all duration-200 active:scale-95 shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
          <span>Về Đăng nhập</span>
        </Link>
      </header>

      {/* Main Card */}
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

          <div className="relative rounded-[28px] sm:rounded-[32px] bg-[#081224]/85 border border-white/[0.12] backdrop-blur-2xl p-6 sm:p-9 shadow-[0_20px_60px_-15px_rgba(0,18,50,0.8)] overflow-hidden">
            <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

            {/* Typography */}
            <motion.div variants={itemVariants} className="text-center mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/30 text-[11px] font-bold text-cyan-300 mb-3 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>Bảo vệ quyền truy cập hồ sơ y tế</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Khôi phục mật khẩu.
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                {step === "input"
                  ? "Nhập số điện thoại hoặc email liên kết để nhận mã xác thực OTP."
                  : `Nhập mã 6 chữ số đã gửi tới ${identifier}`}
              </p>
            </motion.div>

            {/* Error Message */}
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

            {step === "input" ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <motion.div variants={itemVariants} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-300">Số điện thoại hoặc Email</label>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase">
                      {isPhone ? "Điện thoại" : "Email"}
                    </span>
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
                        <Smartphone className={`w-4 h-4 ${focusedField === "identifier" ? "text-cyan-400" : ""}`} />
                      ) : (
                        <Mail className={`w-4 h-4 ${focusedField === "identifier" ? "text-cyan-400" : ""}`} />
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

                <motion.div variants={itemVariants} className="pt-2">
                  <LiquidMetalButton type="submit" isLoading={isSubmitting}>
                    Gửi mã xác thực OTP
                  </LiquidMetalButton>
                </motion.div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <motion.div variants={itemVariants} className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep("input")}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Nhập lại thông tin</span>
                  </button>
                  <span className="text-[11px] font-bold text-slate-400">Bước 2/2</span>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
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
                </motion.div>

                <motion.div variants={itemVariants} className="flex items-center justify-between text-xs pt-1 text-slate-400">
                  <span>Chưa nhận được mã?</span>
                  {countdown > 0 ? (
                    <span className="text-cyan-400 font-semibold">Gửi lại sau {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setCountdown(60);
                        sendPhoneOtp(identifier);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline"
                    >
                      Gửi lại mã OTP
                    </button>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} className="pt-2">
                  <LiquidMetalButton type="submit" isLoading={isSubmitting} isSuccess={isSuccess}>
                    Xác thực & Đặt mật khẩu mới
                  </LiquidMetalButton>
                </motion.div>
              </form>
            )}

            {/* Bottom Back Link */}
            <motion.div
              variants={itemVariants}
              className="mt-6 pt-5 border-t border-white/[0.08] text-center text-xs text-slate-400"
            >
              Nhớ mật khẩu?{" "}
              <Link href="/login" className="font-extrabold text-cyan-300 hover:text-cyan-200 hover:underline">
                Đăng nhập ngay
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

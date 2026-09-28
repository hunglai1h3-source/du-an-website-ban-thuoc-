"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { LiquidMetalButton } from "@/components/auth/LiquidMetalButton";
import { SpatialLoginBackground } from "@/components/auth/SpatialLoginBackground";
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Check,
} from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const target = searchParams.get("target") || "";
  const shouldReduceMotion = useReducedMotion();

  const [password, setPassword] = useState<string>("H4careNew@2026");
  const [confirmPassword, setConfirmPassword] = useState<string>("H4careNew@2026");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

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

  // Password strength calculator
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
    "bg-slate-700",
    "bg-rose-500",
    "bg-amber-500",
    "bg-cyan-500",
    "bg-emerald-500",
  ];

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
              THIẾT LẬP MẬT KHẨU
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
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tiêu chuẩn bảo mật y tế số</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Tạo mật khẩu mới.
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                {target ? (
                  <>
                    Thiết lập mật khẩu bảo vệ tài khoản{" "}
                    <span className="text-cyan-300 font-semibold">{target}</span>.
                  </>
                ) : (
                  "Thiết lập mật khẩu mới bảo vệ hồ sơ đơn thuốc của bạn."
                )}
              </p>
            </motion.div>

            {/* Error Notification */}
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Mật khẩu mới <span className="text-cyan-400">*</span>
                </label>
                <div
                  className={`relative rounded-2xl bg-white/[0.03] border transition-all duration-200 flex items-center ${
                    focusedField === "password"
                      ? "border-cyan-400/80 bg-cyan-950/20 shadow-[0_0_16px_rgba(34,211,238,0.18)]"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="pl-4 pr-2 text-slate-400">
                    <Lock className={`w-4 h-4 ${focusedField === "password" ? "text-cyan-400" : ""}`} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Tối thiểu 6 ký tự..."
                    className="w-full h-12 pr-11 bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-white p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-cyan-400" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                <div className="pt-1.5">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Độ mạnh mật khẩu:</span>
                    <span className="font-semibold text-cyan-300">{strengthLabels[strength]}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`rounded-full transition-all duration-300 ${
                          strength >= level ? strengthColors[strength] : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Confirm Password */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Xác nhận lại mật khẩu <span className="text-cyan-400">*</span>
                </label>
                <div
                  className={`relative rounded-2xl bg-white/[0.03] border transition-all duration-200 flex items-center ${
                    focusedField === "confirmPassword"
                      ? "border-cyan-400/80 bg-cyan-950/20 shadow-[0_0_16px_rgba(34,211,238,0.18)]"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="pl-4 pr-2 text-slate-400">
                    <Lock className={`w-4 h-4 ${focusedField === "confirmPassword" ? "text-cyan-400" : ""}`} />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Nhập lại mật khẩu mới..."
                    className="w-full h-12 pr-11 bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-white p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4 text-cyan-400" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>

              {/* Signature Liquid Metal Button */}
              <motion.div variants={itemVariants} className="pt-2">
                <LiquidMetalButton type="submit" isLoading={isSubmitting} isSuccess={isSuccess}>
                  Lưu mật khẩu & Đăng nhập
                </LiquidMetalButton>
              </motion.div>
            </form>

            <motion.div
              variants={itemVariants}
              className="mt-6 pt-5 border-t border-white/[0.08] text-center text-xs text-slate-400"
            >
              Quay lại trang{" "}
              <Link href="/login" className="font-extrabold text-cyan-300 hover:text-cyan-200 hover:underline">
                Đăng nhập
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050b18] flex items-center justify-center text-cyan-400">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

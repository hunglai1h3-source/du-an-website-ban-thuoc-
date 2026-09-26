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
  User,
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Check,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { isAuthenticated, register } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/account");
    }
  }, [isAuthenticated, router]);

  // Form Fields
  const [fullName, setFullName] = useState<string>("Nguyễn Văn An");
  const [phone, setPhone] = useState<string>("0901234567");
  const [formattedPhone, setFormattedPhone] = useState<string>("0901 234 567");
  const [carrier, setCarrier] = useState<string>("MobiFone");
  const [email, setEmail] = useState<string>("an.nguyen@example.com");
  const [password, setPassword] = useState<string>("H4carePass@2026");
  const [confirmPassword, setConfirmPassword] = useState<string>("H4carePass@2026");

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);

  // Status feedback
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Focus tracking
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

  // Phone Formatter Utility
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage("Vui lòng nhập họ và tên của bạn.");
      return;
    }
    if (!phone || phone.length < 9) {
      setErrorMessage("Số điện thoại chưa đúng định dạng.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Mật khẩu tối thiểu 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (!agreeTerms) {
      setErrorMessage("Vui lòng đồng ý với Điều khoản dịch vụ & Chính sách y tế.");
      return;
    }

    setIsSubmitting(true);
    const res = await register({
      fullName: fullName.trim(),
      phone,
      email: email.trim() || undefined,
      password,
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/account");
      }, 750);
    } else {
      setErrorMessage(res.error || "Đăng ký không thành công. Vui lòng thử lại.");
    }
  };

  // Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
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
      {/* ================= SPATIAL MULTI-LAYER BACKGROUND ================= */}
      <SpatialLoginBackground mouseParallax={mouseParallax} />

      {/* ================= TOP NAVIGATION BAR ================= */}
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
              HỒ SƠ THÀNH VIÊN
            </span>
          </div>
        </Link>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/40 backdrop-blur-md transition-all duration-200 active:scale-95 shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
          <span>Đăng nhập</span>
        </Link>
      </header>

      {/* ================= MAIN INTERACTION STAGE ================= */}
      <main className="relative z-20 flex-1 w-full max-w-lg mx-auto px-4 sm:px-6 flex flex-col justify-center py-6 sm:py-10">
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

          {/* Architectural Glass Slab Card */}
          <div className="relative rounded-[28px] sm:rounded-[32px] bg-[#081224]/85 border border-white/[0.12] backdrop-blur-2xl p-6 sm:p-9 shadow-[0_20px_60px_-15px_rgba(0,18,50,0.8)] overflow-hidden">
            <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

            {/* Header Typography */}
            <motion.div variants={itemVariants} className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/30 text-[11px] font-bold text-cyan-300 mb-3 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hồ sơ chăm sóc sức khỏe gia đình</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Tạo tài khoản hội viên.
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                Lưu trữ đơn thuốc trọn đời, tích điểm 2% và tư vấn Dược sĩ 1-1 cùng{" "}
                <span className="text-cyan-300 font-semibold">H4CARE</span>.
              </p>
            </motion.div>

            {/* Error Feedback */}
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Họ và tên của bạn <span className="text-cyan-400">*</span>
                </label>
                <div
                  className={`relative rounded-2xl bg-white/[0.03] border transition-all duration-200 flex items-center ${
                    focusedField === "name"
                      ? "border-cyan-400/80 bg-cyan-950/20 shadow-[0_0_16px_rgba(34,211,238,0.18)]"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="pl-4 pr-2 text-slate-400">
                    <User className={`w-4 h-4 ${focusedField === "name" ? "text-cyan-400" : ""}`} />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Nguyễn Văn An"
                    className="w-full h-11 pr-4 bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none"
                    required
                  />
                </div>
              </motion.div>

              {/* Phone with Carrier Badge */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300">
                    Số điện thoại di động <span className="text-cyan-400">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 rounded-md uppercase">
                    {carrier}
                  </span>
                </div>
                <div
                  className={`relative rounded-2xl bg-white/[0.03] border transition-all duration-200 flex items-center ${
                    focusedField === "phone"
                      ? "border-cyan-400/80 bg-cyan-950/20 shadow-[0_0_16px_rgba(34,211,238,0.18)]"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <span className="pl-4 pr-2 text-xs font-bold text-cyan-300/90 border-r border-white/10 select-none">
                    🇻🇳 +84
                  </span>
                  <input
                    type="tel"
                    value={formattedPhone}
                    onChange={(e) => {
                      const res = formatPhoneString(e.target.value);
                      setPhone(res.raw);
                      setFormattedPhone(res.formatted);
                      setCarrier(res.carrier);
                    }}
                    onFocus={() => setFocusedField("phone")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="0901 234 567"
                    className="w-full h-11 px-3 bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none"
                    required
                  />
                </div>
              </motion.div>

              {/* Email */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300">Email (nhận hóa đơn & đơn thuốc điện tử)</label>
                  <span className="text-[10px] text-slate-500">Tùy chọn</span>
                </div>
                <div
                  className={`relative rounded-2xl bg-white/[0.03] border transition-all duration-200 flex items-center ${
                    focusedField === "email"
                      ? "border-cyan-400/80 bg-cyan-950/20 shadow-[0_0_16px_rgba(34,211,238,0.18)]"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="pl-4 pr-2 text-slate-400">
                    <Mail className={`w-4 h-4 ${focusedField === "email" ? "text-cyan-400" : ""}`} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="ten@email.com"
                    className="w-full h-11 pr-4 bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </motion.div>

              {/* Password & Confirm Password (Grid) */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Mật khẩu <span className="text-cyan-400">*</span>
                  </label>
                  <div
                    className={`relative rounded-2xl bg-white/[0.03] border transition-all duration-200 flex items-center ${
                      focusedField === "password"
                        ? "border-cyan-400/80 bg-cyan-950/20 shadow-[0_0_16px_rgba(34,211,238,0.18)]"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full h-11 pl-4 pr-9 bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 text-slate-400 hover:text-white p-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5 text-cyan-400" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Xác nhận lại <span className="text-cyan-400">*</span>
                  </label>
                  <div
                    className={`relative rounded-2xl bg-white/[0.03] border transition-all duration-200 flex items-center ${
                      focusedField === "confirmPassword"
                        ? "border-cyan-400/80 bg-cyan-950/20 shadow-[0_0_16px_rgba(34,211,238,0.18)]"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField("confirmPassword")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full h-11 pl-4 pr-9 bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 text-slate-400 hover:text-white p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5 text-cyan-400" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Agreement checkbox */}
              <motion.div variants={itemVariants} className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-white/5 accent-cyan-500 mt-0.5 cursor-pointer"
                  />
                  <span className="leading-snug">
                    Tôi đồng ý với{" "}
                    <span className="text-cyan-300 hover:underline">Điều khoản dịch vụ</span> &{" "}
                    <span className="text-cyan-300 hover:underline">Chính sách bảo mật y tế H4CARE</span>.
                  </span>
                </label>
              </motion.div>

              {/* Signature Liquid Metal Button */}
              <motion.div variants={itemVariants} className="pt-3">
                <LiquidMetalButton type="submit" isLoading={isSubmitting} isSuccess={isSuccess}>
                  Tạo tài khoản H4CARE
                </LiquidMetalButton>
              </motion.div>
            </form>

            {/* Bottom Login Link */}
            <motion.div
              variants={itemVariants}
              className="mt-6 pt-5 border-t border-white/[0.08] text-center text-xs text-slate-400"
            >
              Đã có tài khoản H4CARE?{" "}
              <Link
                href="/login"
                className="font-extrabold text-cyan-300 hover:text-cyan-200 hover:underline transition-colors"
              >
                Đăng nhập ngay
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full py-4 text-center text-[11px] text-slate-500">
        <p>H4CARE • “Chăm sóc sức khỏe, bắt đầu từ sự thấu hiểu.” • Bản quyền thuộc H4CARE</p>
      </footer>
    </div>
  );
}

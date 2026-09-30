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
  Loader2,
  ArrowRight,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, register } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/account");
    }
  }, [isAuthenticated, router]);

  // Form Fields
  const [fullName, setFullName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [formattedPhone, setFormattedPhone] = useState<string>("");
  const [carrier, setCarrier] = useState<string>("Việt Nam (+84)");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);

  // Status feedback
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password strength calculator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: "", color: "" };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;
    if (score <= 1) return { score: 1, text: "Yếu", color: "bg-rose-500", textCol: "text-rose-600" };
    if (score === 2) return { score: 2, text: "Trung bình", color: "bg-amber-500", textCol: "text-amber-600" };
    if (score === 3) return { score: 3, text: "Khá mạnh", color: "bg-sky-500", textCol: "text-sky-600" };
    return { score: 4, text: "Rất an toàn", color: "bg-emerald-500", textCol: "text-emerald-600" };
  };

  const fillSampleNewAccount = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const sampleNames = ["Lê Minh Hoàng", "Vũ Phương Linh", "Đặng Quốc Anh", "Hoàng Kim Ngân", "Phạm Hải Đăng", "Bùi Thanh Trúc"];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const samplePhone = `0977${randomSuffix}`;
    const sampleEmail = `khachhang${randomSuffix}@pharmatrust.vn`;
    
    setFullName(randomName);
    setPhone(samplePhone);
    const formatted = formatPhoneString(samplePhone);
    setFormattedPhone(formatted.formatted);
    setCarrier(formatted.carrier);
    setEmail(sampleEmail);
    setPassword("H4carePass@2026");
    setConfirmPassword("H4carePass@2026");
    setErrorMessage(null);
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
    } else if (val.startsWith("091") || val.startsWith("094") || val.startsWith("088") || val.startsWith("08")) {
      detectedCarrier = "VinaPhone";
    }

    return { raw: val, formatted, carrier: detectedCarrier };
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { raw, formatted, carrier: detectedCarrier } = formatPhoneString(e.target.value);
    setPhone(raw);
    setFormattedPhone(formatted);
    setCarrier(detectedCarrier);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage("Vui lòng nhập họ và tên của bạn.");
      return;
    }
    if (!phone || phone.length < 9) {
      setErrorMessage("Số điện thoại chưa đúng định dạng (tối thiểu 9-10 số).");
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
      setErrorMessage(res.error || "Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.");
    }
  };

  const pwdStrength = getPasswordStrength(password);

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

      {/* Main Container */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8 flex items-center justify-center flex-1">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl border border-slate-200 shadow-depth-2 overflow-hidden">
          
          {/* Left Side: Medical Trust Brand Panel (Desktop Only) */}
          <div className="hidden lg:block lg:col-span-5 relative">
            <AuthBrandPanel />
          </div>

          {/* Right Side: Clean Medical Registration Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center bg-white">
            <div className="w-full max-w-md mx-auto">
              
              {/* Header Title */}
              <div className="mb-6">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-brand-emerald-700 border border-emerald-200/80 text-[11px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald-600" />
                    <span>Hội viên PharmaTrust</span>
                  </div>

                  <button
                    type="button"
                    onClick={fillSampleNewAccount}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-brand-blue-700 hover:bg-sky-100 border border-sky-200/80 text-[11px] font-bold transition-all"
                    title="Điền tự động dữ liệu thành viên ngẫu nhiên để test nhanh"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-brand-blue-600" />
                    <span>Tạo nhanh mẫu</span>
                  </button>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Tạo tài khoản thành viên
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Đăng ký tài khoản để theo dõi đơn thuốc, tích điểm và nhận tư vấn chuyên môn từ Dược sĩ.
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

                {isSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 font-medium leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">Đăng ký thành công! Đang chuyển hướng vào hồ sơ thành viên...</div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Họ và tên của bạn
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn An"
                      required
                      className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-blue-600 focus:ring-4 focus:ring-brand-blue-100 transition-all font-medium"
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <User className="w-4 h-4 text-brand-blue-600" />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">Số điện thoại</label>
                    <span className="text-[10.5px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {carrier}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="tel"
                      value={formattedPhone}
                      onChange={handlePhoneChange}
                      placeholder="0901 234 567"
                      required
                      className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-blue-600 focus:ring-4 focus:ring-brand-blue-100 transition-all font-medium"
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Smartphone className="w-4 h-4 text-brand-blue-600" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email <span className="text-slate-400 font-normal">(không bắt buộc)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nguyenvanan@example.com"
                      className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-blue-600 focus:ring-4 focus:ring-brand-blue-100 transition-all font-medium"
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Mail className="w-4 h-4 text-brand-blue-600" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự..."
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

                  {/* Password strength indicator */}
                  {password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 grid grid-cols-4 gap-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-full transition-colors ${
                              pwdStrength.score >= step ? pwdStrength.color : "bg-transparent"
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-[11px] font-bold ${pwdStrength.textCol}`}>
                        {pwdStrength.text}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu..."
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

                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-600 leading-snug">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-brand-blue-600 border-slate-300 focus:ring-brand-blue-500"
                    />
                    <span>
                      Tôi đồng ý với{" "}
                      <span className="text-brand-blue-600 font-semibold">Điều khoản dịch vụ</span> &{" "}
                      <span className="text-brand-blue-600 font-semibold">Chính sách bảo mật y tế</span>{" "}
                      của PharmaTrust.
                    </span>
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
                      <span>Đang khởi tạo tài khoản...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng ký tài khoản</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Login link */}
              <div className="mt-6 text-center text-xs text-slate-600">
                Đã có tài khoản thành viên?{" "}
                <Link
                  href="/login"
                  className="font-bold text-brand-blue-600 hover:text-brand-blue-800 hover:underline"
                >
                  Đăng nhập tại đây
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

"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  Lock,
  CheckCircle2,
  X,
  Smartphone,
  KeyRound,
  User,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/account";
  const initialTab = (searchParams.get("tab") as "login" | "register" | "forgot") || "login";

  const { isAuthenticated, loginWithPhone, loginWithPassword, sendPhoneOtp, register } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, router, redirectUrl]);

  // Main Tab State: 'login' | 'register' | 'forgot'
  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot">(initialTab);

  // Sync tab with searchParams if it changes
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "register" || tabParam === "forgot" || tabParam === "login") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // ================= LOGIN STATE =================
  const [loginMode, setLoginMode] = useState<"phone" | "otp" | "password">("phone");
  const [loginPhone, setLoginPhone] = useState<string>("0901234567");
  const [formattedLoginPhone, setFormattedLoginPhone] = useState<string>("0901 234 567");
  const [loginCarrier, setLoginCarrier] = useState<string>("MobiFone");
  const [loginChannel, setLoginChannel] = useState<"zalo" | "sms">("zalo");
  const [loginOtp, setLoginOtp] = useState<string[]>(["8", "4", "2", "6", "9", "1"]);
  const [loginIdentifier, setLoginIdentifier] = useState<string>("khachhang@h4care.vn");
  const [loginPassword, setLoginPassword] = useState<string>("H4carePass@2026");

  // ================= REGISTER STATE =================
  const [regName, setRegName] = useState<string>("Nguyễn Văn An");
  const [regPhone, setRegPhone] = useState<string>("0901 234 567");
  const [regRawPhone, setRegRawPhone] = useState<string>("0901234567");
  const [regCarrier, setRegCarrier] = useState<string>("Việt Nam (+84)");
  const [regEmail, setRegEmail] = useState<string>("an.nguyen@example.com");
  const [regPass, setRegPass] = useState<string>("H4carePass@2026");
  const [regConfirmPass, setRegConfirmPass] = useState<string>("H4carePass@2026");

  // ================= FORGOT PASSWORD STATE =================
  const [forgotTarget, setForgotTarget] = useState<string>("0901234567");
  const [forgotStep, setForgotStep] = useState<"input" | "verify">("input");
  const [forgotOtp, setForgotOtp] = useState<string[]>(["8", "4", "2", "6", "9", "1"]);
  const [forgotNewPass, setForgotNewPass] = useState<string>("H4careNew@2026");
  const [forgotConfirmPass, setForgotConfirmPass] = useState<string>("H4careNew@2026");

  // Feedback & Loading
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(60);

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

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loginMode === "otp" && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [loginMode, timer]);

  // ================= HANDLERS: LOGIN =================
  const handleLoginPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginPhone || loginPhone.length < 9) {
      setErrorMsg("Vui lòng nhập số điện thoại hợp lệ (9 - 10 chữ số).");
      return;
    }

    setIsSubmitting(true);
    const res = await sendPhoneOtp(loginPhone);
    setIsSubmitting(false);

    if (res.success) {
      setLoginMode("otp");
      setTimer(60);
      setSuccessMsg(`Mã OTP đã gửi qua ${loginChannel === "zalo" ? "Zalo ZNS" : "Tin nhắn SMS"}`);
    } else {
      setErrorMsg(res.error || "Gửi OTP không thành công.");
    }
  };

  const handleLoginOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const otp = loginOtp.join("");
    if (otp.length < 6) {
      setErrorMsg("Vui lòng nhập đủ 6 chữ số mã OTP.");
      return;
    }

    setIsSubmitting(true);
    const res = await loginWithPhone(loginPhone, otp);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg("Xác thực thành công! Đang chuyển hướng...");
      setTimeout(() => router.push(redirectUrl), 500);
    } else {
      setErrorMsg(res.error || "Mã OTP không chính xác.");
    }
  };

  const handleLoginPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    setIsSubmitting(true);
    const res = await loginWithPassword(loginIdentifier, loginPassword);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg("Đăng nhập thành công! Đang chuyển hướng...");
      setTimeout(() => router.push(redirectUrl), 500);
    } else {
      setErrorMsg(res.error || "Thông tin đăng nhập không chính xác.");
    }
  };

  // ================= HANDLERS: REGISTER =================
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!regName.trim() || regName.trim().length < 2) {
      setErrorMsg("Vui lòng nhập họ và tên của bạn.");
      return;
    }
    if (!regRawPhone || regRawPhone.length < 9) {
      setErrorMsg("Số điện thoại chưa đúng định dạng.");
      return;
    }
    if (regPass.length < 6) {
      setErrorMsg("Mật khẩu tối thiểu 6 ký tự.");
      return;
    }
    if (regPass !== regConfirmPass) {
      setErrorMsg("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSubmitting(true);
    const res = await register({
      fullName: regName,
      phone: regRawPhone,
      email: regEmail,
      password: regPass,
    });
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg("Đăng ký thành công! Đang chuyển hướng vào tài khoản...");
      setTimeout(() => router.push("/account"), 500);
    } else {
      setErrorMsg(res.error || "Đăng ký không thành công.");
    }
  };

  // ================= HANDLERS: FORGOT PASSWORD =================
  const handleForgotTargetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!forgotTarget.trim()) {
      setErrorMsg("Vui lòng nhập số điện thoại hoặc email.");
      return;
    }

    setIsSubmitting(true);
    await sendPhoneOtp(forgotTarget);
    setIsSubmitting(false);

    setForgotStep("verify");
    setSuccessMsg(`Mã OTP đã được gửi tới ${forgotTarget}`);
  };

  const handleForgotResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (forgotOtp.join("").length < 6) {
      setErrorMsg("Vui lòng nhập đủ 6 chữ số mã OTP.");
      return;
    }
    if (forgotNewPass.length < 6) {
      setErrorMsg("Mật khẩu mới tối thiểu 6 ký tự.");
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setErrorMsg("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMsg("Cập nhật mật khẩu thành công! Bạn có thể đăng nhập ngay.");
      setActiveTab("login");
      setLoginMode("password");
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f4f6f9] text-slate-900">
      
      {/* ================= TOP PHARMACY TRUST BAR ================= */}
      <header className="bg-[#1250dc] text-white shadow-xs sticky top-0 z-30">
        <div className="border-b border-white/10 text-xs py-1.5 px-4 hidden sm:block">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-[11px] text-white/90">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
                100% Thuốc chính hãng • Chuẩn GPP Bộ Y Tế
              </span>
              <span>•</span>
              <span>Bảo quản chuẩn GSP • Giao hỏa tốc 2 giờ</span>
              <span>•</span>
              <span>Đổi trả 30 ngày tận nhà</span>
            </div>
            <div>
              <a href="tel:18006868" className="hover:underline font-extrabold flex items-center gap-1.5 text-white">
                <PhoneCall className="w-3 h-3 text-cyan-300" />
                <span>Tổng đài Dược sĩ: 1800 6868 (Miễn phí)</span>
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white text-[#1250dc] font-black text-xl flex items-center justify-center shadow-xs">
              H4
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight leading-none">H4CARE</span>
              </div>
              <span className="text-[10px] tracking-wider text-cyan-200 uppercase font-semibold">HỆ THỐNG NHÀ THUỐC TIÊN PHONG</span>
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

      {/* ================= MAIN CARD CONTAINER ================= */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        
        <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600"></div>

          {/* 3 TABS SWITCHER: ĐĂNG NHẬP | ĐĂNG KÝ | QUÊN MẬT KHẨU */}
          <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-2xl mb-6 text-xs font-bold border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setSuccessMsg(null);
                setActiveTab("login");
              }}
              className={`py-2.5 rounded-xl transition-all ${
                activeTab === "login"
                  ? "bg-[#1250dc] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              1. Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setSuccessMsg(null);
                setActiveTab("register");
              }}
              className={`py-2.5 rounded-xl transition-all ${
                activeTab === "register"
                  ? "bg-[#1250dc] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              2. Đăng ký
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setSuccessMsg(null);
                setActiveTab("forgot");
              }}
              className={`py-2.5 rounded-xl transition-all ${
                activeTab === "forgot"
                  ? "bg-[#1250dc] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              3. Quên mật khẩu
            </button>
          </div>

          {/* Alert Messages */}
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

          {/* ==========================================================
               TAB 1: ĐĂNG NHẬP
          ========================================================== */}
          {activeTab === "login" && (
            <div className="space-y-4">
              <div className="text-center mb-5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Đăng nhập tài khoản</h1>
                <p className="text-xs text-slate-500 mt-1">Nhập số điện thoại để mua thuốc & tích điểm thành viên</p>
              </div>

              {loginMode === "phone" && (
                <form onSubmit={handleLoginPhoneSubmit} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">Số điện thoại của bạn</label>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#1250dc] border border-blue-100">
                        {loginCarrier}
                      </span>
                    </div>

                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-bold text-slate-600 border-r border-slate-200 pr-2.5 select-none">
                        🇻🇳 +84
                      </span>
                      <input
                        type="tel"
                        value={formattedLoginPhone}
                        onChange={(e) => {
                          const res = formatPhoneString(e.target.value);
                          setLoginPhone(res.raw);
                          setFormattedLoginPhone(res.formatted);
                          setLoginCarrier(res.carrier);
                        }}
                        placeholder="0912 345 678"
                        className="w-full h-12 pl-20 pr-10 text-sm font-bold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc] focus:ring-3 focus:ring-blue-500/15 tracking-wide"
                        required
                      />
                      {loginPhone && (
                        <button
                          type="button"
                          onClick={() => {
                            setLoginPhone("");
                            setFormattedLoginPhone("");
                            setLoginCarrier("Việt Nam (+84)");
                          }}
                          className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Kênh nhận mã OTP:</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer font-bold ${
                          loginChannel === "zalo"
                            ? "border-blue-200 bg-blue-50/80 text-[#1250dc]"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="login-channel"
                          value="zalo"
                          checked={loginChannel === "zalo"}
                          onChange={() => setLoginChannel("zalo")}
                          className="text-blue-600"
                        />
                        <span className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded bg-[#0068ff] text-white text-[9px] font-black flex items-center justify-center">Z</span>
                          <span>Zalo ZNS (1s)</span>
                        </span>
                      </label>

                      <label
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer font-bold ${
                          loginChannel === "sms"
                            ? "border-blue-200 bg-blue-50/80 text-[#1250dc]"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="login-channel"
                          value="sms"
                          checked={loginChannel === "sms"}
                          onChange={() => setLoginChannel("sms")}
                          className="text-blue-600"
                        />
                        <span>Tin nhắn SMS</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl bg-[#1250dc] hover:bg-[#0d42b8] text-white text-sm font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    <span>{isSubmitting ? "Đang gửi OTP..." : "Tiếp tục bằng mã OTP"}</span>
                    {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setLoginMode("password")}
                      className="font-bold text-[#1250dc] hover:underline"
                    >
                      Đăng nhập bằng Mật khẩu
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("forgot")}
                      className="font-bold text-slate-500 hover:text-[#1250dc] hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>

                  <div className="text-center pt-2 text-xs text-slate-500 border-t border-slate-100">
                    Chưa có tài khoản?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("register")}
                      className="font-extrabold text-[#1250dc] hover:underline"
                    >
                      Đăng ký thành viên mới
                    </button>
                  </div>
                </form>
              )}

              {loginMode === "otp" && (
                <form onSubmit={handleLoginOtpSubmit} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setLoginMode("phone")}
                      className="text-xs font-bold text-[#1250dc] hover:underline flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Đổi số điện thoại</span>
                    </button>
                    <span className="text-[11px] text-slate-400">Bước 2/2</span>
                  </div>

                  <div className="p-3.5 bg-blue-50/90 border border-blue-100 rounded-2xl text-xs text-blue-900 leading-relaxed">
                    Mã xác thực đã được gửi qua <strong className="text-[#1250dc]">{loginChannel === "zalo" ? "Zalo ZNS" : "Tin nhắn SMS"}</strong> tới số <strong className="text-slate-900 font-extrabold">{formattedLoginPhone}</strong>.
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-700">Nhập mã OTP</label>
                      <button
                        type="button"
                        onClick={() => setLoginOtp(["8", "4", "2", "6", "9", "1"])}
                        className="text-[11px] font-bold text-[#1250dc] hover:underline"
                      >
                        Dán mã nhanh (842691)
                      </button>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {loginOtp.map((val, idx) => (
                        <input
                          key={idx}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={val}
                          onChange={(e) => {
                            const newOtp = [...loginOtp];
                            newOtp[idx] = e.target.value.slice(-1);
                            setLoginOtp(newOtp);
                          }}
                          className="w-full h-12 text-center text-lg font-black rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc] focus:ring-3 focus:ring-blue-500/15"
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
                </form>
              )}

              {loginMode === "password" && (
                <form onSubmit={handleLoginPasswordSubmit} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setLoginMode("phone")}
                      className="text-xs font-bold text-[#1250dc] hover:underline flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Dùng Số điện thoại (OTP)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("forgot")}
                      className="text-xs font-bold text-slate-500 hover:text-[#1250dc] hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Số điện thoại hoặc Email</label>
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="w-full h-12 px-4 text-sm font-semibold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc] focus:ring-3 focus:ring-blue-500/15"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
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
          )}

          {/* ==========================================================
               TAB 2: ĐĂNG KÝ THÀNH VIÊN
          ========================================================== */}
          {activeTab === "register" && (
            <div className="space-y-4">
              <div className="text-center mb-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Hồ sơ chăm sóc sức khỏe gia đình</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tạo tài khoản hội viên</h2>
                <p className="text-xs text-slate-500 mt-1">Lưu trữ đơn thuốc trọn đời, tích điểm 2% & tư vấn Dược sĩ 1-1</p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Họ và tên của bạn <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Nhập họ và tên..."
                    className="w-full h-11 px-4 text-sm font-semibold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc] focus:ring-3 focus:ring-blue-500/15"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">Số điện thoại di động <span className="text-rose-500">*</span></label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#1250dc]">
                      {regCarrier}
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-bold text-slate-600 border-r border-slate-200 pr-2 select-none">🇻🇳 +84</span>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => {
                        const res = formatPhoneString(e.target.value);
                        setRegRawPhone(res.raw);
                        setRegPhone(res.formatted);
                        setRegCarrier(res.carrier);
                      }}
                      placeholder="0912 345 678"
                      className="w-full h-11 pl-20 pr-4 text-sm font-semibold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc] focus:ring-3 focus:ring-blue-500/15"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Địa chỉ Email (nhận đơn thuốc điện tử)</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ten@example.com"
                    className="w-full h-11 px-4 text-sm font-semibold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc] focus:ring-3 focus:ring-blue-500/15"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu <span className="text-rose-500">*</span></label>
                    <input
                      type="password"
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                      className="w-full h-11 px-4 text-sm font-semibold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc] focus:ring-3 focus:ring-blue-500/15"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Xác nhận lại <span className="text-rose-500">*</span></label>
                    <input
                      type="password"
                      value={regConfirmPass}
                      onChange={(e) => setRegConfirmPass(e.target.value)}
                      className="w-full h-11 px-4 text-sm font-semibold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc] focus:ring-3 focus:ring-blue-500/15"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-[#1250dc] hover:bg-[#0d42b8] text-white text-sm font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
                >
                  <span>{isSubmitting ? "Đang tạo hồ sơ..." : "Tạo tài khoản thành viên"}</span>
                  {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                </button>

                <div className="text-center pt-2 text-xs text-slate-500 border-t border-slate-100">
                  Đã có tài khoản?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className="font-extrabold text-[#1250dc] hover:underline"
                  >
                    Đăng nhập tại đây
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ==========================================================
               TAB 3: QUÊN MẬT KHẨU
          ========================================================== */}
          {activeTab === "forgot" && (
            <div className="space-y-4">
              <div className="text-center mb-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold mb-2 border border-amber-200">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  <span>Khôi phục quyền truy cập</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Đặt lại mật khẩu</h2>
                <p className="text-xs text-slate-500 mt-1">Xác thực mã OTP để bảo vệ an toàn hồ sơ đơn thuốc của bạn</p>
              </div>

              {forgotStep === "input" ? (
                <form onSubmit={handleForgotTargetSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Số điện thoại hoặc Email đã đăng ký</label>
                    <input
                      type="text"
                      value={forgotTarget}
                      onChange={(e) => setForgotTarget(e.target.value)}
                      placeholder="0912 345 678 hoặc email..."
                      className="w-full h-12 px-4 text-sm font-semibold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc] focus:ring-3 focus:ring-blue-500/15"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl bg-[#1250dc] hover:bg-[#0d42b8] text-white text-sm font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    <span>{isSubmitting ? "Đang gửi OTP..." : "Gửi mã xác thực OTP"}</span>
                    {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                  </button>

                  <div className="text-center pt-2 text-xs border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveTab("login")}
                      className="font-extrabold text-[#1250dc] hover:underline"
                    >
                      ← Quay lại Đăng nhập
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleForgotResetSubmit} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setForgotStep("input")}
                      className="text-xs font-bold text-[#1250dc] hover:underline flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Nhập lại số điện thoại</span>
                    </button>
                    <span className="text-[11px] text-slate-400">Bước 2/2</span>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 leading-relaxed">
                    Mã xác thực đã được gửi tới <strong>{forgotTarget}</strong>.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Mã xác thực OTP (6 số)</label>
                    <div className="grid grid-cols-6 gap-2">
                      {forgotOtp.map((val, idx) => (
                        <input
                          key={idx}
                          type="text"
                          maxLength={1}
                          value={val}
                          onChange={(e) => {
                            const newOtp = [...forgotOtp];
                            newOtp[idx] = e.target.value.slice(-1);
                            setForgotOtp(newOtp);
                          }}
                          className="w-full h-11 text-center text-lg font-bold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc]"
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu mới</label>
                    <input
                      type="password"
                      value={forgotNewPass}
                      onChange={(e) => setForgotNewPass(e.target.value)}
                      className="w-full h-11 px-4 text-sm font-semibold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc] focus:ring-3 focus:ring-blue-500/15"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Xác nhận lại mật khẩu mới</label>
                    <input
                      type="password"
                      value={forgotConfirmPass}
                      onChange={(e) => setForgotConfirmPass(e.target.value)}
                      className="w-full h-11 px-4 text-sm font-semibold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc] focus:ring-3 focus:ring-blue-500/15"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl bg-[#1250dc] hover:bg-[#0d42b8] text-white text-sm font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    <span>{isSubmitting ? "Đang lưu..." : "Lưu mật khẩu & Đăng nhập ngay"}</span>
                    {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

        {/* 3 H4CARE Member Perks */}
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1250dc] flex items-center justify-center mx-auto mb-1 font-black text-xs">
              %
            </div>
            <span className="font-extrabold text-slate-900 block text-[11px]">Tích lũy 2%</span>
            <span className="text-[10px] text-slate-500 leading-tight block">Trừ thẳng đơn sau</span>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1 font-black text-xs">
              ⚡
            </div>
            <span className="font-extrabold text-slate-900 block text-[11px]">Giao nhanh 2h</span>
            <span className="text-[10px] text-slate-500 leading-tight block">Freeship từ 300k</span>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto mb-1 font-black text-xs">
              📋
            </div>
            <span className="font-extrabold text-slate-900 block text-[11px]">Sổ toa thuốc</span>
            <span className="text-[10px] text-slate-500 leading-tight block">Lưu đơn trọn đời</span>
          </div>
        </div>

        {/* Live Pharmacist Helpline Pill */}
        <div className="mt-3.5 p-2.5 sm:p-3 bg-white rounded-2xl border border-slate-200/90 flex items-center justify-between text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1250dc] font-bold flex items-center justify-center text-xs border border-blue-100">
                DS
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
            </div>
            <div>
              <span className="font-bold text-slate-900 block text-[11px]">DS. Nguyễn Minh Anh (ĐH Dược Hà Nội)</span>
              <span className="text-[10px] text-slate-500">Cần hỗ trợ trực tiếp từ Dược sĩ?</span>
            </div>
          </div>
          <a href="tel:18006868" className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1250dc] font-bold text-[11px] transition-colors">
            Gọi 1800 6868
          </a>
        </div>

      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-white border-t border-slate-200 py-3 px-4 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            <span className="font-extrabold text-slate-800">HỆ THỐNG NHÀ THUỐC H4CARE</span>
            <span className="hidden sm:inline"> — </span>
            <span className="block sm:inline text-[11px]">Chăm sóc sức khỏe gia đình chuẩn GPP & GSP</span>
          </div>
          <div className="text-[11px] font-semibold text-[#1250dc]">
            Hotline Dược sĩ: 1800 6868 (Miễn phí)
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

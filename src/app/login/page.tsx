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
  MessageSquare,
  Smartphone,
  Award,
  Zap,
  FileText,
  UserCheck,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/account";

  const { user, isAuthenticated, loginWithPhone, loginWithPassword, sendPhoneOtp } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, router, redirectUrl]);

  // View state: 'phone' | 'otp' | 'password'
  const [viewState, setViewState] = useState<"phone" | "otp" | "password">("phone");

  // Dynamic Time Greeting
  const [greeting, setGreeting] = useState<{ icon: string; text: string }>({
    icon: "☀️",
    text: "Chào mừng bạn đến với H4CARE",
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting({ icon: "☀️", text: "Chào buổi sáng, chúc bạn một ngày dồi dào sức khỏe!" });
    } else if (hour < 18) {
      setGreeting({ icon: "🌤️", text: "Chào buổi chiều, mua sắm thuốc chính hãng tại H4CARE" });
    } else {
      setGreeting({ icon: "🌙", text: "Chào buổi tối, Dược sĩ H4CARE luôn sẵn sàng hỗ trợ" });
    }
  }, []);

  // Phone flow state with smart formatting
  const [rawPhone, setRawPhone] = useState<string>("0901234567");
  const [formattedPhone, setFormattedPhone] = useState<string>("0901 234 567");
  const [carrier, setCarrier] = useState<string>("MobiFone");
  const [otpChannel, setOtpChannel] = useState<"zalo" | "sms">("zalo");

  // 6-digit OTP state
  const [otpValues, setOtpValues] = useState<string[]>(["8", "4", "2", "6", "9", "1"]);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password state
  const [identifier, setIdentifier] = useState<string>("khachhang@h4care.vn");
  const [password, setPassword] = useState<string>("H4carePass@2026");

  // Feedback & Loading
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(60);

  // Phone formatter
  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 10) val = val.substring(0, 10);
    setRawPhone(val);

    // Format 4-3-3
    let formatted = "";
    if (val.length > 0) formatted += val.substring(0, 4);
    if (val.length > 4) formatted += " " + val.substring(4, 7);
    if (val.length > 7) formatted += " " + val.substring(7, 10);
    setFormattedPhone(formatted);

    // Carrier detection
    if (val.startsWith("090") || val.startsWith("093") || val.startsWith("070") || val.startsWith("079")) {
      setCarrier("MobiFone");
    } else if (val.startsWith("098") || val.startsWith("097") || val.startsWith("086") || val.startsWith("03")) {
      setCarrier("Viettel");
    } else if (val.startsWith("091") || val.startsWith("094") || val.startsWith("088")) {
      setCarrier("VinaPhone");
    } else {
      setCarrier("Việt Nam (+84)");
    }
  };

  const handleClearPhone = () => {
    setRawPhone("");
    setFormattedPhone("");
    setCarrier("Việt Nam (+84)");
  };

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

  // Submit phone -> send OTP
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!rawPhone || rawPhone.length < 9) {
      setErrorMsg("Vui lòng nhập số điện thoại hợp lệ (9 - 10 chữ số).");
      return;
    }

    setIsSubmitting(true);
    const res = await sendPhoneOtp(rawPhone);
    setIsSubmitting(false);

    if (res.success) {
      setViewState("otp");
      setTimer(60);
      setSuccessMsg(
        `Mã xác thực OTP đã được gửi qua ${otpChannel === "zalo" ? "Zalo ZNS" : "Tin nhắn SMS"} tới số ${formattedPhone}`
      );
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

  // Quick paste OTP
  const handleQuickPasteOtp = () => {
    const defaultCode = ["8", "4", "2", "6", "9", "1"];
    setOtpValues(defaultCode);
    otpInputRefs.current[5]?.focus();
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
    const res = await loginWithPhone(rawPhone, otp);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg("Xác thực thành công! Đang chuyển hướng vào nhà thuốc...");
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

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f4f6f9] text-slate-900">
      
      {/* ================= TOP LONG CHÂU 2.0 TRUST BAR ================= */}
      <header className="bg-[#1250dc] text-white shadow-xs sticky top-0 z-30">
        {/* Micro Bar */}
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

        {/* Main Bar */}
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white text-[#1250dc] font-black text-xl flex items-center justify-center shadow-xs">
              H4
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight leading-none">H4CARE</span>
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded-md bg-white/20 text-white">PRO 2.0</span>
              </div>
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

      {/* ================= MAIN CARD CONTAINER ================= */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        
        <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90 relative overflow-hidden">
          {/* Top Blue Accent */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600"></div>

          {/* Time Greeting & Headline */}
          <div className="text-center mb-6 pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1250dc] text-xs font-bold mb-3 border border-blue-100/80">
              <span>{greeting.icon}</span>
              <span>{greeting.text}</span>
            </div>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Đăng nhập hoặc Đăng ký
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Nhập số điện thoại để mua thuốc, tích điểm & kết nối Dược sĩ
            </p>
          </div>

          {/* Alerts */}
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

          {/* ================= STEP 1: PHONE INPUT (LONG CHÂU 2.0) ================= */}
          {viewState === "phone" && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">Số điện thoại của bạn</label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#1250dc] border border-blue-100">
                    {carrier}
                  </span>
                </div>

                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-slate-600 border-r border-slate-200 pr-2.5 flex items-center gap-1 select-none">
                    <span>🇻🇳</span> +84
                  </span>
                  <input
                    type="tel"
                    value={formattedPhone}
                    onChange={handlePhoneInputChange}
                    placeholder="0912 345 678"
                    className="w-full h-12 pl-20 pr-10 text-sm font-bold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc] focus:ring-3 focus:ring-blue-500/15 tracking-wide transition-all"
                    required
                  />
                  {rawPhone && (
                    <button
                      type="button"
                      onClick={handleClearPhone}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Tự động nhận diện hội viên cũ hoặc tạo mới hồ sơ</span>
              </div>

              {/* Channel Selector: Zalo ZNS vs SMS */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Kênh nhận mã OTP:</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer font-bold transition-colors ${
                      otpChannel === "zalo"
                        ? "border-blue-200 bg-blue-50/80 text-[#1250dc]"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="otp-channel"
                      value="zalo"
                      checked={otpChannel === "zalo"}
                      onChange={() => setOtpChannel("zalo")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded bg-[#0068ff] text-white text-[9px] font-black flex items-center justify-center">Z</span>
                      <span>Zalo ZNS (1s)</span>
                    </span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer font-bold transition-colors ${
                      otpChannel === "sms"
                        ? "border-blue-200 bg-blue-50/80 text-[#1250dc]"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="otp-channel"
                      value="sms"
                      checked={otpChannel === "sms"}
                      onChange={() => setOtpChannel("sms")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                      <span>Tin nhắn SMS</span>
                    </span>
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

              {/* Divider */}
              <div className="relative flex items-center justify-center pt-1">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-[11px] text-slate-400 font-medium uppercase tracking-wider">hoặc</span>
              </div>

              {/* Secondary Alternatives */}
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
                    <span>Zalo Login</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-1">
                Bằng việc tiếp tục, bạn đồng ý với <Link href="/terms" className="text-[#1250dc] hover:underline font-semibold">Điều khoản dịch vụ</Link> và <Link href="/privacy" className="text-[#1250dc] hover:underline font-semibold">Chính sách bảo mật đơn thuốc</Link> của H4CARE.
              </p>
            </form>
          )}

          {/* ================= STEP 2: OTP INPUT (WITH QUICK PASTE) ================= */}
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

              <div className="p-3.5 bg-blue-50/90 border border-blue-100 rounded-2xl text-xs text-blue-900 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-[#1250dc] text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  Mã OTP 6 số đã được gửi qua <strong className="text-[#1250dc]">{otpChannel === "zalo" ? "Zalo ZNS" : "Tin nhắn SMS"}</strong> tới số <strong className="text-slate-900 font-extrabold">{formattedPhone}</strong>.
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">Nhập mã OTP</label>
                  <button
                    type="button"
                    onClick={handleQuickPasteOtp}
                    className="text-[11px] font-bold text-[#1250dc] hover:underline"
                  >
                    Dán mã nhanh (842691)
                  </button>
                </div>

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
                <span>{isSubmitting ? "Đang kiểm tra..." : "Xác nhận & Vào nhà thuốc"}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    if (timer > 0) return;
                    await sendPhoneOtp(rawPhone);
                    setTimer(60);
                    setSuccessMsg("Mã OTP mới đã được gửi lại!");
                  }}
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

        {/* 3 MEMBER PERKS LONG CHÂU 2.0 (ĐẶC QUYỀN THỰC TẾ) */}
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
              <span className="text-[10px] text-slate-500">Cần hỗ trợ đăng nhập?</span>
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
            <span className="font-extrabold text-slate-800">H4CARE PHARMACY • PHIÊN BẢN 2.0</span>
            <span className="hidden sm:inline"> — </span>
            <span className="block sm:inline text-[11px]">Hệ thống nhà thuốc chuẩn mực cho gia đình</span>
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

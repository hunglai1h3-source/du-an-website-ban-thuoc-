"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { ArrowLeft, ArrowRight, ShieldCheck, PhoneCall, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, register } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/account");
    }
  }, [isAuthenticated, router]);

  const [fullName, setFullName] = useState<string>("Nguyễn Văn An");
  const [phone, setPhone] = useState<string>("0901234567");
  const [email, setEmail] = useState<string>("khachhang@h4care.vn");
  const [password, setPassword] = useState<string>("H4carePass@2026");
  const [confirmPassword, setConfirmPassword] = useState<string>("H4carePass@2026");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg("Vui lòng nhập họ và tên của bạn.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 9) {
      setErrorMsg("Số điện thoại chưa hợp lệ (tối thiểu 9 - 10 chữ số).");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Mật khẩu tối thiểu 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSubmitting(true);
    const res = await register({
      fullName,
      phone,
      email,
      password,
    });
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg("Đăng ký tài khoản thành công! Đang chuyển hướng...");
      setTimeout(() => {
        router.push("/account");
      }, 600);
    } else {
      setErrorMsg(res.error || "Đăng ký không thành công.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f4f6f9] text-slate-900">
      
      {/* ================= HEADER ================= */}
      <header className="bg-[#1250dc] text-white shadow-xs sticky top-0 z-30">
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
            href="/login"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Đăng nhập</span>
          </Link>
        </div>
      </header>

      {/* ================= MAIN REGISTER CARD ================= */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 sm:p-6 flex items-center justify-center">
        <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <ShieldCheck className="w-7 h-7 text-[#1250dc]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Tạo tài khoản thành viên
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Khởi tạo hồ sơ chăm sóc sức khỏe gia đình chuẩn y tế
            </p>
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Họ và tên của bạn <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên..."
                className="w-full h-11 px-4 text-sm font-semibold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc] focus:ring-3 focus:ring-blue-500/15"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Số điện thoại di động <span className="text-rose-500">*</span></label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-bold text-slate-600 border-r border-slate-200 pr-2 select-none">🇻🇳 +84</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912 345 678"
                  className="w-full h-11 pl-20 pr-4 text-sm font-semibold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc] focus:ring-3 focus:ring-blue-500/15"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Địa chỉ Email (tùy chọn để nhận đơn thuốc)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten@example.com"
                className="w-full h-11 px-4 text-sm font-semibold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc] focus:ring-3 focus:ring-blue-500/15"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu <span className="text-rose-500">*</span></label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 px-4 text-sm font-semibold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc] focus:ring-3 focus:ring-blue-500/15"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Xác nhận lại <span className="text-rose-500">*</span></label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              <span>{isSubmitting ? "Đang tạo hồ sơ..." : "Đăng ký thành viên"}</span>
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>

            <div className="text-center pt-2 text-xs text-slate-500">
              Đã có tài khoản? <Link href="/login" className="font-extrabold text-[#1250dc] hover:underline">Đăng nhập bằng số điện thoại</Link>
            </div>
          </form>

        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-xs text-slate-500 text-center">
        <span>Hệ thống Nhà thuốc H4CARE • Tư vấn miễn cước 1800 6868</span>
      </footer>

    </div>
  );
}

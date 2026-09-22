"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Lock, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState<string>("H4careNew@2026");
  const [confirmPassword, setConfirmPassword] = useState<string>("H4careNew@2026");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg("Mật khẩu mới tối thiểu 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMsg("Cập nhật mật khẩu thành công! Đang chuyển về Đăng nhập...");
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f4f6f9] text-slate-900">
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

      <main className="flex-1 max-w-md w-full mx-auto p-4 sm:p-6 flex items-center justify-center">
        <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-3 shadow-xs text-[#1250dc]">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Tạo mật khẩu mới
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Thiết lập mật khẩu bảo vệ hồ sơ đơn thuốc của bạn
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu mới</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 text-sm font-semibold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc] focus:ring-3 focus:ring-blue-500/15"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Xác nhận lại mật khẩu mới</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-12 px-4 text-sm font-semibold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc] focus:ring-3 focus:ring-blue-500/15"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-[#1250dc] hover:bg-[#0d42b8] text-white text-sm font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <span>{isSubmitting ? "Đang lưu..." : "Lưu mật khẩu & Đăng nhập"}</span>
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-xs text-slate-500 text-center">
        <span>Hỗ trợ kỹ thuật: 1800 6868</span>
      </footer>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, KeyRound, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { sendPhoneOtp } = useAuth();

  const [identifier, setIdentifier] = useState<string>("0901234567");
  const [step, setStep] = useState<"input" | "otp">("input");
  const [otp, setOtp] = useState<string[]>(["8", "4", "2", "6", "9", "1"]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identifier.trim()) {
      setErrorMsg("Vui lòng nhập số điện thoại hoặc email.");
      return;
    }

    setIsSubmitting(true);
    await sendPhoneOtp(identifier);
    setIsSubmitting(false);

    setStep("otp");
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.join("").length < 6) {
      setErrorMsg("Vui lòng nhập đủ 6 chữ số OTP.");
      return;
    }
    router.push("/reset-password");
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
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Khôi phục quyền truy cập
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Nhập thông tin tài khoản để nhận mã xác thực đặt lại mật khẩu
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {step === "input" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Số điện thoại hoặc Email</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
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
                <span>{isSubmitting ? "Đang gửi OTP..." : "Gửi mã xác nhận"}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="text-center pt-2 text-xs">
                <Link href="/login" className="font-bold text-[#1250dc] hover:underline">← Quay lại Đăng nhập</Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 leading-relaxed">
                Mã xác thực đã gửi tới <strong>{identifier}</strong>. Vui lòng kiểm tra tin nhắn.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Nhập mã OTP (6 số)</label>
                <div className="grid grid-cols-6 gap-2">
                  {otp.map((val, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      value={val}
                      onChange={(e) => {
                        const newOtp = [...otp];
                        newOtp[idx] = e.target.value.slice(-1);
                        setOtp(newOtp);
                      }}
                      className="w-full h-12 text-center text-lg font-bold rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1250dc]"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-[#1250dc] hover:bg-[#0d42b8] text-white text-sm font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <span>Xác nhận & Tiếp tục</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2 text-xs">
                <button type="button" onClick={() => setStep("input")} className="font-bold text-[#1250dc] hover:underline">
                  ← Đổi số điện thoại / email
                </button>
              </div>
            </form>
          )}

        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-xs text-slate-500 text-center">
        <span>Hỗ trợ khách hàng: 1800 6868 (Miễn cước)</span>
      </footer>
    </div>
  );
}

"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  User,
  Phone,
  Mail,
  ShieldCheck,
  FileText,
  Clock,
  Award,
  LogOut,
  ChevronRight,
  Package,
  HeartPulse,
} from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/account");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 text-sm">
        Đang tải thông tin thành viên H4CARE...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f9]">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-10">
        
        {/* Top Member Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#1250dc] text-white flex items-center justify-center text-2xl font-black shadow-md shadow-blue-600/20">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : "A"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {user.fullName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1250dc] font-bold text-xs border border-blue-200">
                    {user.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.phone}</span>
                  </span>
                  {user.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{user.email}</span>
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Points & Loyalty */}
            <div className="flex items-center gap-3 bg-blue-50/80 p-3.5 rounded-2xl border border-blue-100 sm:self-center w-full sm:w-auto justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block font-medium">Điểm tích lũy H4Care</span>
                <span className="text-lg font-black text-[#1250dc]">{user.points || 150} điểm</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#1250dc] text-white flex items-center justify-center font-bold text-sm">
                <Award className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Navigation Sidebar */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs h-fit space-y-1">
            <Link
              href="/account"
              className="flex items-center justify-between p-3 rounded-xl bg-blue-50 text-[#1250dc] font-bold text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4" />
                <span>Hồ sơ thành viên</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </Link>

            <a
              href="#prescriptions"
              className="flex items-center justify-between p-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <HeartPulse className="w-4 h-4 text-slate-500" />
                <span>Toa thuốc điện tử của tôi</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>

            <a
              href="#orders"
              className="flex items-center justify-between p-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-slate-500" />
                <span>Lịch sử đơn hàng</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>

            <div className="pt-3 mt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="w-full flex items-center gap-2.5 p-3 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          </div>

          {/* Right Main Content */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Health Records Section */}
            <div id="prescriptions" className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="font-extrabold text-base text-slate-900">Toa thuốc điện tử gần nhất</h2>
                  <p className="text-xs text-slate-500">Lưu trữ đơn thuốc của bạn và gia đình chuẩn GPP</p>
                </div>
                <span className="text-xs font-bold text-[#1250dc] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                  1 Toa thuốc đang dùng
                </span>
              </div>

              {/* Sample Prescription Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">Đơn thuốc: Điều trị cảm cúm & tăng đề kháng</span>
                  <span className="text-slate-500">Kê ngày: 20/09/2026</span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <p>• Paracetamol 500mg (Hộp 50 viên) - Uống sau ăn</p>
                  <p>• Vitamin C 1000mg Tuýp sủi - 1 viên/ngày</p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Dược sĩ tư vấn: DS. Nguyễn Minh Anh
                  </span>
                  <a href="tel:18006868" className="text-[#1250dc] font-bold hover:underline">
                    Gọi tư vấn lại
                  </a>
                </div>
              </div>
            </div>

            {/* Orders Section */}
            <div id="orders" className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="font-extrabold text-base text-slate-900">Đơn hàng gần đây</h2>
                  <p className="text-xs text-slate-500">Theo dõi tiến độ giao hàng 2h</p>
                </div>
                <Link href="/products" className="text-xs font-bold text-[#1250dc] hover:underline">
                  Mua sắm tiếp →
                </Link>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Đơn hàng #H4C-89214</span>
                  <span className="text-[11px] text-slate-500">2 sản phẩm • Giao hàng tận nơi 2h</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                  Đã hoàn thành
                </span>
              </div>
            </div>

          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}

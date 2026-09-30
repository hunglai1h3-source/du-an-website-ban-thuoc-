"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Shield,
  Layers,
  RefreshCw,
  Sliders,
  Globe,
  Boxes,
  Users,
  ShoppingBag,
  CheckCircle2,
  Lock,
  ChevronRight,
  Maximize2,
  Activity,
  Server,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { getAdminAuthQuery, redirectToAdminPortal } from "@/lib/auth/admin-redirect";
import { H4CareLogo } from "@/components/branding/H4CareLogo";
import { FptPolyBadge } from "@/components/branding/FptPolyBadge";

export default function AdminPortalPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [viewMode, setViewMode] = useState<"launchpad" | "embedded">("launchpad");
  const [activeTab, setActiveTab] = useState("/pharmacy-crawler");
  const [iframeKey, setIframeKey] = useState(0);
  const [activePort, setActivePort] = useState<5173 | 8000>(5173);

  const authQuery = typeof window !== "undefined" ? getAdminAuthQuery() : "";

  // Check which port is live (prefer 5173 for Vite dev server, fallback 8000)
  useEffect(() => {
    async function checkPort() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 400);
        await fetch("http://localhost:5173/", { mode: "no-cors", signal: controller.signal });
        clearTimeout(timeout);
        setActivePort(5173);
      } catch {
        setActivePort(8000);
      }
    }
    checkPort();
  }, []);

  const adminBaseUrl = `http://localhost:${activePort}`;

  const adminModules = [
    {
      id: "/pharmacy-crawler",
      title: "Studio Cào Dữ Liệu Thuốc",
      description: "Thu thập dữ liệu thuốc tự động từ Long Châu, Pharmacity, Bộ Y Tế. Cấu hình lịch cào 24/7.",
      icon: Globe,
      color: "bg-blue-50 text-brand-blue-600 border-blue-100",
      tag: "Tự động 24/7",
    },
    {
      id: "/products",
      title: "Hồ Sơ Thuốc & Duyệt Bán",
      description: "Quản lý danh mục 500+ hồ sơ thuốc, chuẩn hóa thành phần và duyệt xuất bản bán hàng trên Storefront.",
      icon: Boxes,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      tag: "Kiểm duyệt",
    },
    {
      id: "/orders",
      title: "Quản Trị Đơn Hàng Khách Đặt",
      description: "Tiếp nhận đơn đặt thuốc từ khách hàng trên Storefront, xác nhận toa và cập nhật tiến độ giao hàng.",
      icon: ShoppingBag,
      color: "bg-amber-50 text-amber-700 border-amber-100",
      tag: "Đơn mua sắm",
    },
    {
      id: "/conflicts",
      title: "Xử Lý Mâu Thuẫn Dữ Liệu",
      description: "Thuật toán phát hiện sai khác về nồng độ, hàm lượng và giá bán giữa các nhà thuốc để Dược sĩ đối chiếu.",
      icon: Sliders,
      color: "bg-rose-50 text-rose-600 border-rose-100",
      tag: "Đối chiếu",
    },
    {
      id: "/",
      title: "Dashboard & Chỉ Số Tin Cậy",
      description: "Bảng tổng quan số lượng hồ sơ, biểu đồ phân bố độ tin cậy dữ liệu và lịch sử các phiên thu thập.",
      icon: Layers,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
      tag: "Tổng quan",
    },
    {
      id: "/users",
      title: "Quản Trị Người Dùng & Phân Quyền",
      description: "Quản lý tài khoản Quản trị viên, Dược sĩ, Nhân viên kiểm duyệt và phân quyền bảo mật hệ thống.",
      icon: Users,
      color: "bg-purple-50 text-purple-600 border-purple-100",
      tag: "Bảo mật",
    },
  ];

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-brand-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Đang khởi tạo kết nối Cổng Quản Trị...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated or Non-Admin Warning State
  if (!isAuthenticated || !user?.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <H4CareLogo size="sm" />
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Web Bán Hàng</span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200 mb-2">
                Khu vực Quản trị Nội bộ
              </span>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Yêu Cầu Quyền Quản Trị Viên
              </h1>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Khu vực này dành riêng cho Quản trị viên và Dược sĩ phụ trách kiểm duyệt dữ liệu & vận hành hệ thống PharmaTrust.
              </p>
            </div>

            {/* Quick Demo Credentials Reminder */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 font-medium">
                <span>Tài khoản Admin:</span>
                <span className="font-mono text-slate-800 font-bold">admin@pharmatrust.vn</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 font-medium">
                <span>Mật khẩu:</span>
                <span className="font-mono text-slate-800 font-bold">Admin@123456</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href="/login?redirect=/admin"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 active:bg-brand-blue-800 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <span>Đăng Nhập Tài Khoản Quản Trị</span>
                <ChevronRight className="w-4 h-4" />
              </Link>

              <Link
                href="/"
                className="w-full block py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
              >
                Quay lại Mua sắm
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 3. Authenticated Admin View
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 select-none z-50 shadow-xs">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            title="Quay lại Website Khách Hàng (Storefront :3000)"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-brand-blue-600" />
            <span className="hidden sm:inline">Về Web Bán Hàng</span>
          </Link>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <H4CareLogo size="sm" />
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Admin Gateway</span>
            </span>
          </div>
        </div>

        {/* View mode toggle & Launch Actions */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode("launchpad")}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                viewMode === "launchpad"
                  ? "bg-white text-brand-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Bảng Điều Hướng
            </button>
            <button
              onClick={() => setViewMode("embedded")}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                viewMode === "embedded"
                  ? "bg-white text-brand-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Nhúng Trực Tiếp
            </button>
          </div>

          {/* Direct Full-Screen Open Button */}
          <button
            type="button"
            onClick={() => redirectToAdminPortal(activeTab, true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 active:bg-brand-blue-800 text-white text-xs font-bold transition-colors shadow-xs"
            title="Mở toàn màn hình Cổng Quản Trị Hệ Thống"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Mở Cổng Quản Trị Toàn Màn Hình</span>
            <span className="md:hidden">Mở Admin</span>
          </button>
        </div>
      </header>

      {/* A. LAUNCHPAD VIEW (Recommended) */}
      {viewMode === "launchpad" ? (
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-8">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-brand-blue-900 via-slate-900 to-brand-blue-950 rounded-2xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl border border-slate-800">
            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-cyan-300 text-xs font-bold border border-white/10 backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hệ thống Quản Trị Dữ Liệu Dược Phẩm Quốc Gia</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                PharmaTrust Data Hub & Admin Portal
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Chào mừng Quản trị viên <strong className="text-white">{user.fullName}</strong>. Truy cập nhanh các mô-đun quản lý, kiểm duyệt hồ sơ thuốc và giám sát tiến độ đơn hàng.
              </p>

              {/* Status bar */}
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span>Máy chủ API: <strong className="text-emerald-300 font-mono">Cổng 8000 (Trực tuyến)</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Admin Dev: <strong className="text-cyan-300 font-mono">Cổng 5173 (Sẵn sàng)</strong></span>
                </div>
              </div>
            </div>

            {/* Background decoration */}
            <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-brand-blue-500/10 to-transparent pointer-events-none" />
          </div>

          {/* Module Cards Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Các Chức Năng Quản Trị Trọng Yếu</h2>
              <span className="text-xs text-slate-500 font-medium">Bấm vào bất kỳ thẻ nào để mở trực tiếp</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {adminModules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <div
                    key={mod.id}
                    onClick={() => {
                      setActiveTab(mod.id);
                      redirectToAdminPortal(mod.id, true);
                    }}
                    className="group bg-white rounded-2xl p-5 border border-slate-200 hover:border-brand-blue-300 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${mod.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {mod.tag}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-blue-600 transition-colors">
                          {mod.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                          {mod.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-blue-600 group-hover:translate-x-0.5 transition-transform">
                      <span>Truy cập mô-đun</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      ) : (
        /* B. EMBEDDED VIEW WITH GUARANTEED FULL HEIGHT & WIDTH */
        <div className="flex-1 flex flex-col w-full bg-slate-100">
          {/* Sub Navigation Bar for Embedded Mode */}
          <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-3 overflow-x-auto">
            <div className="flex items-center gap-1.5 shrink-0">
              {adminModules.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIframeKey((prev) => prev + 1);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-brand-blue-600 text-white shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.title}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIframeKey((prev) => prev + 1)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Tải lại giao diện nhúng"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => redirectToAdminPortal(activeTab, true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                <span>Mở Tab Riêng</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Embedded Iframe Container with guaranteed full viewport sizing */}
          <div className="flex-1 w-full relative bg-slate-50 p-2 sm:p-4">
            <div className="w-full h-full bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <iframe
                key={`${activeTab}-${iframeKey}`}
                src={`${adminBaseUrl}${activeTab}${authQuery}`}
                style={{
                  width: "100%",
                  height: "calc(100vh - 140px)",
                  minHeight: "750px",
                  border: "none",
                  display: "block",
                }}
                title="PharmaTrust Admin System"
                allow="clipboard-read; clipboard-write"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

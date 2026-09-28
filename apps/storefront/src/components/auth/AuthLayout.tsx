"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { H4CareLogo } from "@/components/branding/H4CareLogo";
import { AuthBrandPanel } from "./AuthBrandPanel";
import { motion } from "framer-motion";

interface AuthLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center relative selection:bg-brand-cyan-100 selection:text-brand-blue-900 overflow-x-hidden">
      {/* Background Soft Glow & Grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#0052cc 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Floating Back to Home Link (Desktop & Tablet) */}
      <div className="absolute top-6 left-6 z-20 hidden lg:block">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white/80 backdrop-blur-md border border-slate-200/80 hover:text-brand-blue-600 hover:border-brand-blue-300 hover:bg-white shadow-xs transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Về trang chủ H4CARE</span>
        </Link>
      </div>

      {/* Mobile Top Navigation Header */}
      <div className="lg:hidden flex items-center justify-between px-5 py-4 bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
        <H4CareLogo size="sm" withTagline={false} />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-blue-600 px-2.5 py-1.5 rounded-lg bg-slate-100/70 border border-slate-200/60"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Trang chủ</span>
        </Link>
      </div>

      {/* Main Authentication Container */}
      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 relative z-10 flex items-center justify-center min-h-[calc(100vh-4rem)] lg:min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl border border-slate-200/90 shadow-depth-3 overflow-hidden"
        >
          {/* Left Brand Panel (Desktop 5 cols ~ 42%) */}
          <div className="hidden lg:block lg:col-span-5 relative">
            <AuthBrandPanel />
          </div>

          {/* Right Authentication Form Area (Desktop 7 cols ~ 58%) */}
          <div className="lg:col-span-7 flex flex-col justify-center p-6 sm:p-10 md:p-12 xl:p-14 bg-white relative">
            {children}
          </div>
        </motion.div>
      </div>

      {/* Global Academic Subtext Footer */}
      <div className="relative z-10 text-center py-4 text-[11px] text-slate-400 select-none">
        <span>Đồ án chuyên ngành CNTT • FPT Polytechnic • Nhóm sinh viên H4CARE</span>
      </div>
    </div>
  );
};

"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { HeroVisual } from "./HeroVisual";
import { TRUST_STATS } from "@/data/mockData";
import {
  ArrowRight,
  Stethoscope,
  ShieldCheck,
  CheckCircle2,
  Clock,
  PackageCheck,
  UserCheck,
} from "lucide-react";

export const HeroSection: React.FC = () => {
  // Map trust icon helper
  const renderTrustIcon = (iconName: string) => {
    switch (iconName) {
      case "ShieldCheck":
        return <ShieldCheck className="w-5 h-5 text-brand-blue-600" />;
      case "UserCheck":
        return <UserCheck className="w-5 h-5 text-brand-cyan-600" />;
      case "Clock":
        return <Clock className="w-5 h-5 text-brand-emerald-600" />;
      case "PackageCheck":
        return <PackageCheck className="w-5 h-5 text-brand-blue-600" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-brand-blue-600" />;
    }
  };

  return (
    <section className="relative pt-6 pb-14 md:pt-12 md:pb-20 overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-[#f0f7ff]/40">
      {/* Background Layer: Ambient Glow Shapes */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-20 left-10 w-96 h-96 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute top-1/3 right-10 w-80 h-80 rounded-full bg-cyan-100/30 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-72 h-72 rounded-full bg-emerald-50/40 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* ================= LEFT COLUMN: HEADLINE, CTA & TRUST ================= */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Top Micro-badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-brand-blue-200/80 shadow-depth-1 mb-5"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-emerald-500" />
              </span>
              <span className="text-xs font-bold text-slate-800 tracking-wide">
                Mô hình Dược phẩm Số 2026
              </span>
              <span className="text-[10px] font-semibold text-brand-blue-700 bg-brand-blue-50 px-2 py-0.5 rounded-full border border-brand-blue-100">
                Định hướng chuẩn GPP
              </span>
            </motion.div>

            {/* Main Headline with Balanced Semantic Line Breaks */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="text-[28px] sm:text-4xl md:text-5xl lg:text-[44px] xl:text-[54px] 2xl:text-6xl font-black text-slate-900 tracking-[-0.03em] leading-[1.15] sm:leading-[1.12] mb-5 max-w-2xl [text-wrap:balance]"
            >
              <span className="block">Sức khỏe tốt hơn,</span>
              <span className="block mt-1 sm:mt-1.5 medical-gradient-text">
                bắt đầu từ lựa chọn đúng.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm sm:text-base md:text-lg text-slate-600 font-normal leading-relaxed max-w-xl xl:max-w-2xl mb-8"
            >
              Giải pháp tra cứu và tiếp cận sản phẩm chăm sóc sức khỏe theo cách
              trực quan, an toàn và hiện đại. Hỗ trợ tư vấn chuyên môn Dược khoa,
              giao nhanh tiêu chuẩn bảo quản GSP.
            </motion.p>

            {/* CTA Buttons with Elevated Dominant Primary & Subtle Secondary */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap sm:flex-nowrap items-center gap-3.5 w-full sm:w-auto mb-9"
            >
              <Link href="/products" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto h-12 sm:h-[52px] inline-flex items-center justify-center gap-2.5 px-7 rounded-2xl bg-gradient-to-r from-brand-blue-600 via-brand-blue-600 to-brand-cyan-600 hover:from-brand-blue-700 hover:to-brand-cyan-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-brand-blue-600/25 hover:shadow-xl hover:shadow-brand-blue-600/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 group">
                  <span>Khám phá sản phẩm</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>

              <Link href="/category/thuoc-ke-don" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto h-12 sm:h-[52px] inline-flex items-center justify-center gap-2.5 px-6 rounded-2xl bg-white/90 hover:bg-white text-slate-700 hover:text-brand-blue-700 font-semibold text-sm sm:text-base border border-slate-200/90 hover:border-slate-300 shadow-sm transition-all duration-200 group">
                  <Stethoscope className="w-4 h-4 text-brand-blue-600 transition-transform group-hover:scale-110" />
                  <span>Tư vấn Dược sĩ</span>
                </button>
              </Link>
            </motion.div>

            {/* Trust Indicators Highlights */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.32 }}
              className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-semibold text-slate-600 pt-4 border-t border-slate-200/80 w-full"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-emerald-500" />
                <span>Nguồn gốc minh bạch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-emerald-500" />
                <span>Tư vấn Dược sĩ an toàn</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-emerald-500" />
                <span>Bảo mật dữ liệu cá nhân</span>
              </div>
            </motion.div>
          </div>

          {/* ================= RIGHT COLUMN: INTERACTIVE 3D VISUAL ================= */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex justify-center"
          >
            <HeroVisual />
          </motion.div>
        </div>

        {/* ================= 4 TRUST STATS BAR (PHASE UI-1 BENCHMARK) ================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 sm:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5"
        >
          {TRUST_STATS.map((stat, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-depth-1 hover:shadow-depth-2 hover:border-brand-blue-200 transition-all duration-150 group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 group-hover:bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center shrink-0 transition-colors duration-150">
                  {renderTrustIcon(stat.icon)}
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight block">
                    {stat.value}
                  </span>
                  <p className="text-xs font-bold text-slate-800">{stat.label}</p>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{stat.sublabel}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

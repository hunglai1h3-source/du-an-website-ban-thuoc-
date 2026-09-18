"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { HeroVisual } from "./HeroVisual";
import { Button } from "../ui/Button";
import { TRUST_STATS } from "@/data/mockData";
import {
  ArrowRight,
  Stethoscope,
  ShieldCheck,
  Sparkles,
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
    <section className="relative pt-6 pb-16 md:pt-12 md:pb-24 overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-[#f0f7ff]/40">
      {/* Background ambient medical glow shapes */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-20 left-10 w-96 h-96 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute top-1/3 right-10 w-80 h-80 rounded-full bg-cyan-100/40 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-72 h-72 rounded-full bg-emerald-50/50 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* ================= LEFT COLUMN: HEADLINE, CTA & TRUST ================= */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Top Micro-badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-brand-blue-200/80 shadow-sm mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-emerald-500" />
              </span>
              <span className="text-xs font-bold text-slate-800 tracking-wide">
                Nền tảng Y tế & Dược phẩm 2026
              </span>
              <span className="text-[10px] font-semibold text-brand-blue-600 bg-brand-blue-50 px-2 py-0.5 rounded-full">
                Chuẩn GPP
              </span>
            </motion.div>

            {/* Main Headline with Line & Blur Reveal */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12] mb-6"
            >
              Sức khỏe tốt hơn,
              <br />
              <span className="medical-gradient-text">bắt đầu từ lựa chọn đúng.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-lg md:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mb-8"
            >
              Giải pháp tìm kiếm và mua sắm sản phẩm chăm sóc sức khỏe theo cách
              đơn giản, trực quan và hiện đại. Tư vấn 100% bởi Dược sĩ Đại học,
              giao nhanh 2h tận cửa nhà.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center gap-4 w-full sm:w-auto mb-10"
            >
              <Link href="/products" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full sm:w-auto shadow-medical group"
                  rightIcon={
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  }
                >
                  Khám phá sản phẩm
                </Button>
              </Link>

              <Link href="/consultation" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-slate-300 hover:border-brand-blue-400 group"
                  leftIcon={<Stethoscope className="w-4 h-4 text-brand-blue-600" />}
                >
                  Tư vấn ngay với Dược sĩ
                </Button>
              </Link>
            </motion.div>

            {/* Trust Indicators Highlights */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-semibold text-slate-600 pt-4 border-t border-slate-200/80 w-full"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-emerald-500" />
                <span>100% Thuốc chính hãng</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-emerald-500" />
                <span>Đổi trả 30 ngày linh hoạt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-emerald-500" />
                <span>Bảo mật đơn thuốc tuyệt đối</span>
              </div>
            </motion.div>
          </div>

          {/* ================= RIGHT COLUMN: INTERACTIVE 3D VISUAL ================= */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex justify-center"
          >
            <HeroVisual />
          </motion.div>
        </div>

        {/* ================= 4 TRUST STATS BAR (PHASE UI-1 POLISH) ================= */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14 sm:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6"
        >
          {TRUST_STATS.map((stat, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-sm hover:shadow-medical transition-all duration-200 group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 group-hover:bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center shrink-0 transition-colors">
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

"use client";

import React, { useState } from "react";
import { IntroAnimation } from "@/components/intro/IntroAnimation";
import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/hero/HeroSection";
import { FptPolyBadge } from "@/components/branding/FptPolyBadge";
import { AbstractSymbol } from "@/components/branding/AbstractSymbol";
import { ShieldCheck, Heart, Sparkles, Stethoscope, Award, ArrowUpRight } from "lucide-react";

export default function HomePage() {
  const [showIntro, setShowIntro] = useState(false);
  const [introKey, setIntroKey] = useState(0);

  const handleReplayIntro = () => {
    setIntroKey((prev) => prev + 1);
    setShowIntro(true);
  };

  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* 1. Cinematic Intro Sequence (Auto-runs on first visit, replayable) */}
      <IntroAnimation
        key={introKey}
        forceShow={showIntro}
        onComplete={() => setShowIntro(false)}
      />

      {/* 2. Global Sticky Header */}
      <Header onReplayIntro={handleReplayIntro} />

      {/* 3. Hero Section (Phase UI-1 Benchmark) */}
      <HeroSection />

      {/* 4. Phase UI-1 Milestone Showcase & Status Bar */}
      <section className="py-12 border-t border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center shrink-0 border border-brand-blue-100">
                <AbstractSymbol size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-brand-blue-600 uppercase tracking-wider">
                    Giai đoạn Hiện Tại: Phase UI-1 Hoàn Thành
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Đã hoàn thiện trọn vẹn 6 trụ cột UI/UX & Motion Y tế
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  Bao gồm: Intro Sequence 5 cảnh điện ảnh • Global Page Transition & Smooth Scroll • Header Sticky Glass • Mega Menu đa tầng • Search Experience thông minh • Hero Section chuẩn 2026.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleReplayIntro}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-brand-blue-700 bg-brand-blue-50 hover:bg-brand-blue-100 border border-brand-blue-200 transition-all duration-200 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-cyan-500" />
                <span>Phát lại Intro 5 Cảnh</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Clean Academic Project Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-slate-900 text-slate-400 text-xs py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <FptPolyBadge variant="dark" />
              <div className="text-[11px] text-slate-400">
                <span className="text-slate-300 font-semibold">Đồ án sinh viên FPT Polytechnic</span>
                <span className="mx-2">•</span>
                <span>Thực hiện bởi nhóm 4 thành viên: Hùng • Đức Anh • Hoàn • Cường</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 text-center md:text-right">
              <p>© 2026 H4CARE. Dự án nghiên cứu trải nghiệm người dùng E-Commerce Dược Phẩm.</p>
              <p className="text-slate-400 text-[10px] mt-0.5">Giao diện độc bản • Tuân thủ chuẩn thông tin y tế</p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

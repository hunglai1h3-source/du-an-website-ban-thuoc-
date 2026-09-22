"use client";

import React from "react";
import { H4CareLogo } from "@/components/branding/H4CareLogo";
import { AbstractSymbol } from "@/components/branding/AbstractSymbol";
import { ShieldCheck, Search, HeartPulse, Clock, Sparkles } from "lucide-react";

export const AuthBrandPanel: React.FC = () => {
  return (
    <div className="relative h-full flex flex-col justify-between p-8 xl:p-12 text-slate-800 overflow-hidden bg-gradient-to-br from-brand-blue-50/90 via-slate-50 to-brand-cyan-50/50 select-none border-r border-slate-200/80">
      {/* Subtle Healthcare Ambient Background Layers */}
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-brand-blue-400/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-20 w-72 h-72 rounded-full bg-brand-cyan-400/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 left-10 w-96 h-96 rounded-full bg-brand-emerald-400/10 blur-3xl pointer-events-none" />

      {/* Subtle Medical Grid Watermark */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#0052cc 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Top Header: Logo + Brand Identity */}
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <H4CareLogo size="md" withTagline={false} />
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/80 text-brand-blue-700 border border-brand-blue-200/70 shadow-xs backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald-500 animate-pulse" />
            Hệ Thống Y Tế 2026
          </span>
        </div>

        {/* Narrative & Tagline */}
        <div className="mt-8 space-y-2">
          <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Chăm sóc sức khỏe,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue-700 via-brand-blue-600 to-brand-cyan-600">
              bắt đầu từ sự thấu hiểu.
            </span>
          </h2>
          <p className="text-sm text-slate-600 font-normal leading-relaxed max-w-md pt-1">
            Một tài khoản an toàn kết nối toàn bộ hệ sinh thái tra cứu dược phẩm, tư vấn Dược sĩ và theo dõi đơn thuốc của bạn.
          </p>
        </div>
      </div>

      {/* Centerpiece: Pharmaceutical Geometry & 4-Node Signature */}
      <div className="relative z-10 my-8 py-4">
        {/* Abstract Healthcare Geometric Composition */}
        <div className="relative mx-auto max-w-sm p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-depth-2">
          {/* Decorative Corner Glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-brand-cyan-100/50 to-transparent rounded-tr-2xl pointer-events-none" />

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-blue-600 to-brand-cyan-500 text-white flex items-center justify-center shrink-0 shadow-medical">
              <AbstractSymbol size={28} withGlow={false} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-blue-700 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-brand-cyan-500" />
                Đồng hành cùng sức khỏe bạn
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium leading-normal">
                Dữ liệu tài khoản được bảo mật theo tiêu chuẩn y tế và phân quyền chuyên nghiệp.
              </p>
            </div>
          </div>

          {/* 3 Trust Pillars */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-3.5">
            <div className="flex items-center gap-3 text-xs text-slate-700">
              <div className="w-7 h-7 rounded-lg bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center shrink-0 border border-brand-blue-100">
                <Search className="w-3.5 h-3.5" />
              </div>
              <div className="leading-snug">
                <span className="font-semibold text-slate-900 block">Tra cứu nhanh & chính xác</span>
                <span className="text-[11px] text-slate-500">Dược thư rõ ràng, định hướng chuẩn GPP</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-700">
              <div className="w-7 h-7 rounded-lg bg-brand-emerald-50 text-brand-emerald-600 flex items-center justify-center shrink-0 border border-brand-emerald-100">
                <HeartPulse className="w-3.5 h-3.5" />
              </div>
              <div className="leading-snug">
                <span className="font-semibold text-slate-900 block">Lưu sản phẩm quan tâm</span>
                <span className="text-[11px] text-slate-500">Quản lý danh sách dùng thuốc cho cả gia đình</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-700">
              <div className="w-7 h-7 rounded-lg bg-brand-cyan-50 text-brand-cyan-700 flex items-center justify-center shrink-0 border border-brand-cyan-100">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="leading-snug">
                <span className="font-semibold text-slate-900 block">Theo dõi đơn thuốc 24/7</span>
                <span className="text-[11px] text-slate-500">Hỗ trợ tư vấn chuyên môn cùng Dược sĩ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer: Trust Stamp */}
      <div className="relative z-10 pt-4 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-brand-emerald-600 shrink-0" />
          <span>Bảo mật dữ liệu cá nhân theo chuẩn y tế</span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium hidden xl:inline">
          H4CARE • FPT Polytechnic
        </span>
      </div>
    </div>
  );
};

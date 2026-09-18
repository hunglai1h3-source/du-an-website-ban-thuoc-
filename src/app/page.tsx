"use client";

import React, { useState } from "react";
import Link from "next/link";
import { IntroAnimation } from "@/components/intro/IntroAnimation";
import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/hero/HeroSection";
import { FptPolyBadge } from "@/components/branding/FptPolyBadge";
import { AbstractSymbol } from "@/components/branding/AbstractSymbol";
import { PRODUCTS_DATA } from "@/data/products";
import { Product } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductQuickViewModal } from "@/components/product/ProductQuickViewModal";
import { RxConsultModal } from "@/components/product/RxConsultModal";
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Flame,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  const [showIntro, setShowIntro] = useState(false);
  const [introKey, setIntroKey] = useState(0);

  // Modals state for product interaction on Home Page
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [rxConsultProduct, setRxConsultProduct] = useState<Product | null>(null);

  const handleReplayIntro = () => {
    setIntroKey((prev) => prev + 1);
    setShowIntro(true);
  };

  // Best seller products (4 items)
  const bestSellers = PRODUCTS_DATA.filter((p) => p.isBestSeller).slice(0, 4);

  // Featured prescription & OTC items (4 items)
  const featuredProducts = PRODUCTS_DATA.filter((p) => p.isFeatured).slice(0, 4);

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

      {/* 4. REAL PRODUCTS SHOWCASE: SẢN PHẨM BÁN CHẠY NHẤT (CORE-1 to CORE-4) */}
      <section className="py-14 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
                <Flame className="w-4 h-4 fill-current" />
                <span>Bán Chạy Nhất Tại Nhà Thuốc</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Sản Phẩm Y Tế Được Tin Dùng
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                100% Thuốc chính hãng, date mới nhất, được kiểm định bởi Hội đồng Dược sĩ H4CARE.
              </p>
            </div>

            <Link href="/products">
              <Button
                variant="outline"
                size="sm"
                className="group"
                rightIcon={<ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />}
              >
                Xem tất cả {PRODUCTS_DATA.length} sản phẩm
              </Button>
            </Link>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {bestSellers.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(p) => setQuickViewProduct(p)}
                onOpenRxConsult={(p) => setRxConsultProduct(p)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 5. NỔI BẬT & THUỐC KÊ ĐƠN TƯ VẤN (Rx Showcase) */}
      <section className="py-14 bg-slate-50/70 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-blue-600 uppercase tracking-wider mb-1">
                <Award className="w-4 h-4" />
                <span>Danh Mục Thuốc Tiêu Biểu</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Chuyên Khoa & Hỗ Trợ Đơn Thuốc
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Bao gồm thuốc kê đơn điều trị bệnh mạn tính và sản phẩm chăm sóc sức khỏe chất lượng cao.
              </p>
            </div>

            <Link href="/category/thuoc-ke-don">
              <Button
                variant="primary"
                size="sm"
                className="bg-brand-blue-700 hover:bg-brand-blue-800 text-xs"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Gửi toa thuốc khám
              </Button>
            </Link>
          </div>

          {/* Featured Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(p) => setQuickViewProduct(p)}
                onOpenRxConsult={(p) => setRxConsultProduct(p)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 6. Phase UI Milestone Showcase & Status Bar */}
      <section className="py-10 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200/90 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center shrink-0 border border-brand-blue-100">
                <AbstractSymbol size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-brand-blue-600 uppercase tracking-wider">
                    Trạng Thái Dự Án: Hoàn Thành CORE-0 Đến CORE-4
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Hệ thống Dữ liệu Sản phẩm Dược khoa & Điều hướng Thực tế Đã Hoạt Động
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  Bao gồm: Data Model 25 sản phẩm y tế • Trang danh sách /products có lọc đa chiều & sắp xếp • Trang danh mục /category/[slug] • Product Card tuân thủ quy tắc Rx • Trang chi tiết /product/[slug] chuyên sâu.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleReplayIntro}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-brand-blue-700 bg-white hover:bg-brand-blue-50 border border-slate-200 transition-all duration-200 active:scale-95 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-cyan-500" />
                <span>Phát lại Intro 5 Cảnh</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      <ProductQuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onOpenRxConsult={(p) => setRxConsultProduct(p)}
      />

      {/* Rx Consultation Modal */}
      <RxConsultModal
        product={rxConsultProduct}
        isOpen={!!rxConsultProduct}
        onClose={() => setRxConsultProduct(null)}
      />

      {/* 7. Clean Academic Project Footer */}
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

"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, ArrowRight, Pill, FileUp, Sparkles } from "lucide-react";

export default function EmptyCartState() {
  return (
    <div className="max-w-xl mx-auto my-8 bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 text-center shadow-xs">
      <div className="w-16 h-16 rounded-full bg-blue-50 text-brand-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100">
        <ShoppingBag className="w-8 h-8" />
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
        Giỏ hàng của bạn đang trống
      </h2>

      <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
        Chưa có sản phẩm thuốc hay thực phẩm chức năng nào trong giỏ hàng. Hãy khám phá danh mục dược phẩm chính hãng hoặc gửi toa thuốc để Dược sĩ tư vấn.
      </p>

      {/* Main CTA */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/products"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold text-sm shadow-xs transition-all cursor-pointer"
        >
          <Pill className="w-4 h-4" />
          <span>Tìm mua thuốc ngay</span>
        </Link>

        <Link
          href="/prescription"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all cursor-pointer"
        >
          <FileUp className="w-4 h-4 text-brand-blue-600" />
          <span>Gửi đơn thuốc cho Dược sĩ</span>
        </Link>
      </div>

      {/* Popular category chips */}
      <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-500">
        <p className="font-semibold text-slate-700 mb-2.5">
          Danh mục thuốc thường tìm kiếm:
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/category/thuoc-khong-ke-don"
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Thuốc hạ sốt & Giảm đau
          </Link>
          <Link
            href="/category/thuoc-khong-ke-don"
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Trị ho & Cảm cúm
          </Link>
          <Link
            href="/category/thuoc-khong-ke-don"
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Dạ dày & Tiêu hóa
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { CheckCircle2, ChevronUp } from "lucide-react";

interface MobileStickyCheckoutBarProps {
  totalAmount: number;
  totalItems: number;
  isSubmitting: boolean;
  isAddressVerified?: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onScrollToSummary?: () => void;
}

export default function MobileStickyCheckoutBar({
  totalAmount,
  totalItems,
  isSubmitting,
  isAddressVerified = true,
  onSubmit,
  onScrollToSummary,
}: MobileStickyCheckoutBarProps) {
  if (totalItems === 0) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-lg safe-bottom">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Left: Total Price */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span>Tổng thanh toán</span>
            {onScrollToSummary && (
              <button
                type="button"
                onClick={onScrollToSummary}
                className="text-brand-blue-600 inline-flex items-center"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="text-base sm:text-lg font-black text-rose-600 font-mono tracking-tight leading-tight">
            {totalAmount.toLocaleString("vi-VN")} đ
          </div>
        </div>

        {/* Right: CTA Button */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || totalItems === 0}
          className="px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0 cursor-pointer bg-brand-blue-600 hover:bg-brand-blue-700 active:bg-brand-blue-800"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Đang xử lý...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Đặt hàng</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

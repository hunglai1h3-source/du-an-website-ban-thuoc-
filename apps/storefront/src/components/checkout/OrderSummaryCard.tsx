"use client";

import React, { useState } from "react";
import {
  Tag,
  ShieldCheck,
  Truck,
  PhoneCall,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Lock,
  AlertCircle,
} from "lucide-react";
import { FulfillmentType } from "./FulfillmentSelector";

interface OrderSummaryCardProps {
  subtotal: number;
  shippingFee: number;
  discount: number;
  grandTotal: number;
  totalItems: number;
  fulfillmentType: FulfillmentType;
  voucherCode: string;
  setVoucherCode: (v: string) => void;
  appliedVoucher: string | null;
  onApplyVoucher: (code: string) => void;
  onRemoveVoucher: () => void;
  voucherError: string;
  isSubmitting: boolean;
  isAddressVerified?: boolean;
  onSubmitOrder: (e: React.FormEvent) => void;
}

export default function OrderSummaryCard({
  subtotal,
  shippingFee,
  discount,
  grandTotal,
  totalItems,
  fulfillmentType,
  voucherCode,
  setVoucherCode,
  appliedVoucher,
  onApplyVoucher,
  onRemoveVoucher,
  voucherError,
  isSubmitting,
  isAddressVerified = true,
  onSubmitOrder,
}: OrderSummaryCardProps) {
  const freeshipThreshold = 300000;
  const remainingForFreeship = Math.max(0, freeshipThreshold - subtotal);
  const freeshipProgress = Math.min(100, Math.round((subtotal / freeshipThreshold) * 100));

  const effectiveShippingFee = fulfillmentType === "STORE_PICKUP" ? 0 : shippingFee;
  const finalTotal = Math.max(0, subtotal + effectiveShippingFee - discount);
  const isDeliveryUnverified = fulfillmentType === "DELIVERY" && !isAddressVerified;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs sticky top-20">
      {/* Header */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-900">
          Tóm tắt đơn hàng
        </h2>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Freeship Progress Bar (Long Châu style) */}
        {fulfillmentType === "DELIVERY" && (
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-brand-blue-600" />
                <span>
                  {subtotal >= freeshipThreshold
                    ? "Đơn hàng đủ điều kiện MIỄN PHÍ VẬN CHUYỂN!"
                    : `Mua thêm ${remainingForFreeship.toLocaleString("vi-VN")} đ để được FREESHIP`}
                </span>
              </span>
              <span className="font-bold text-brand-blue-700">{freeshipProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-brand-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${freeshipProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Voucher Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Mã giảm giá / Ưu đãi
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã (VD: H4CARENEW)"
                disabled={Boolean(appliedVoucher)}
                className="w-full pl-8 pr-3 py-2 text-xs uppercase rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 font-mono disabled:bg-slate-100"
              />
              <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {appliedVoucher ? (
              <button
                type="button"
                onClick={onRemoveVoucher}
                className="px-3 py-2 text-xs font-semibold text-rose-600 border border-rose-200 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
              >
                Hủy mã
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onApplyVoucher(voucherCode)}
                disabled={!voucherCode.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 rounded-lg transition-colors cursor-pointer"
              >
                Áp dụng
              </button>
            )}
          </div>

          {appliedVoucher && (
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Đã áp dụng mã: <strong>{appliedVoucher}</strong></span>
            </p>
          )}

          {voucherError && (
            <p className="text-[11px] text-rose-600 font-medium">
              {voucherError}
            </p>
          )}
        </div>

        {/* Financial Line Items */}
        <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Tạm tính ({totalItems} sản phẩm):</span>
            <span className="font-semibold text-slate-800">
              {subtotal.toLocaleString("vi-VN")} đ
            </span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>Phí vận chuyển:</span>
            <span className="font-semibold">
              {fulfillmentType === "STORE_PICKUP" ? (
                <span className="text-emerald-700 font-bold">Miễn phí (Nhận tại quầy)</span>
              ) : effectiveShippingFee === 0 ? (
                <span className="text-emerald-700 font-bold">Miễn phí</span>
              ) : (
                <span className="text-slate-800">{effectiveShippingFee.toLocaleString("vi-VN")} đ</span>
              )}
            </span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Giảm giá ưu đãi:</span>
              <span>-{discount.toLocaleString("vi-VN")} đ</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
            <div>
              <span className="text-sm font-bold text-slate-900 block">
                Tổng thanh toán:
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                (Đã bao gồm thuế VAT)
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-black text-rose-600 font-mono tracking-tight">
                {finalTotal.toLocaleString("vi-VN")} đ
              </span>
            </div>
          </div>
        </div>

        {/* Unverified Address Warning */}
        {isDeliveryUnverified && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-amber-950">Chưa xác nhận địa chỉ giao thuốc</p>
              <p className="text-[11px] text-amber-800 leading-normal">
                Vui lòng chọn xong 3 cấp hành chính, kiểm tra ghim bản đồ và bấm <strong>"Xác nhận địa chỉ này"</strong> để kích hoạt nút đặt hàng.
              </p>
            </div>
          </div>
        )}

        {/* Main CTA: Place Order Button */}
        <button
          type="button"
          onClick={onSubmitOrder}
          disabled={isSubmitting || totalItems === 0 || isDeliveryUnverified}
          className="w-full py-3.5 px-4 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 active:bg-brand-blue-800 text-white font-bold text-sm sm:text-base shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Đang xử lý đơn hàng...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>ĐẶT HÀNG NGAY</span>
            </>
          )}
        </button>

        <p className="text-[10.5px] text-slate-400 text-center leading-normal">
          Bằng việc nhấn "Đặt hàng ngay", bạn đồng ý với{" "}
          <span className="underline">Quy chế hoạt động</span> &amp;{" "}
          <span className="underline">Chính sách bảo mật y tế</span> của H4CARE.
        </p>

        {/* Pharmacy Trust Commitments (Clean & Subtle) */}
        <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-600">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>100% thuốc &amp; dược phẩm chính hãng chuẩn GPP</span>
          </div>
          <div className="flex items-start gap-2">
            <PhoneCall className="w-4 h-4 text-brand-blue-600 shrink-0 mt-0.5" />
            <span>Dược sĩ chuyên môn gọi tư vấn xác nhận trước khi giao</span>
          </div>
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>Đóng gói kín đáo, bảo mật thông tin người nhận</span>
          </div>
        </div>
      </div>
    </div>
  );
}

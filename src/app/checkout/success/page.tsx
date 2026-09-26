"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { formatVND } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  PhoneCall,
  ShieldCheck,
  Truck,
  ArrowRight,
  Home,
  FileText,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "H4C-782914";
  const name = searchParams.get("name") || "Quý khách";
  const phone = searchParams.get("phone") || "0901 234 567";
  const total = Number(searchParams.get("total")) || 185000;
  const method = searchParams.get("method") || "cod";

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-depth-2 text-center space-y-6">
        
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        {/* Headline */}
        <div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-2">
            Đơn Hàng Đã Được Tiếp Nhận
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Đặt Thuốc Thành Công!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
            Cảm ơn bạn <strong className="text-slate-800">{name}</strong> đã tin chọn H4CARE. Dược sĩ chuyên môn đang chuẩn bị phác đồ và đơn thuốc của bạn.
          </p>
        </div>

        {/* Order Details Ticket Box */}
        <div className="bg-slate-50/90 rounded-2xl p-5 border border-slate-200/90 text-left space-y-3.5 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="text-slate-500">Mã tra cứu đơn thuốc:</span>
            <span className="font-mono text-sm font-black text-brand-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
              {orderId}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
            <div>
              <span className="text-slate-400 block text-[11px]">Người nhận:</span>
              <strong className="text-slate-900">{name}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Số điện thoại:</span>
              <strong className="text-slate-900">{phone}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Phương thức thanh toán:</span>
              <strong className="text-slate-900">
                {method === "vietqr"
                  ? "Chuyển khoản VietQR tự động"
                  : "Thanh toán khi nhận hàng (COD)"}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Tổng giá trị đơn:</span>
              <strong className="text-emerald-700 text-sm font-black">
                {formatVND(total)}
              </strong>
            </div>
          </div>
        </div>

        {/* Pharmacist Call Banner */}
        <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-start sm:items-center gap-3.5 text-left text-xs text-blue-900">
          <div className="w-10 h-10 rounded-xl bg-brand-blue-600 text-white flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block">
              Dược sĩ sẽ gọi lại trong 15 phút
            </span>
            <p className="text-slate-600 text-[11px] mt-0.5">
              Để xác thực đơn thuốc, hướng dẫn liều uống cụ thể và hẹn giờ giao hàng hỏa tốc 2 giờ.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/products" className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full" leftIcon={<Home className="w-4 h-4" />}>
              Về Trang Sản Phẩm
            </Button>
          </Link>
          <Link href="/account#orders" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              className="w-full shadow-medical"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Xem Lịch Sử Đơn Hàng
            </Button>
          </Link>
        </div>

      </div>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-brand-blue-600 border-t-transparent animate-spin" />
          </div>
        }
      >
        <OrderSuccessContent />
      </Suspense>
      <Footer />
    </div>
  );
}

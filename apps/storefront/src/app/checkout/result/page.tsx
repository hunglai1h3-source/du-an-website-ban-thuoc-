"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShoppingBag,
  RotateCcw,
  ShieldCheck,
  FileText,
  CreditCard,
} from "lucide-react";

interface PaymentStatusResponse {
  order_code: string;
  order_status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  customer_name: string;
  created_at: string;
  transaction?: {
    partner_trans_id: string;
    gateway_status: string;
    amount: number;
    completed_at: string;
  };
}

function CheckoutResultContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || searchParams.get("order_code") || "";
  const resultCode = searchParams.get("resultCode");
  const message = searchParams.get("message") || "";
  const transId = searchParams.get("transId") || "";
  const amountStr = searchParams.get("amount") || "";

  // Extract clean order_code if orderId has format "ORDERCODE_momo_..."
  const cleanOrderCode = orderId.includes("_momo_")
    ? orderId.split("_momo_")[0]
    : orderId;

  const [isLoading, setIsLoading] = useState(true);
  const [orderData, setOrderData] = useState<PaymentStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSuccess = resultCode === "0" || orderData?.payment_status === "PAID";

  useEffect(() => {
    if (!cleanOrderCode) {
      setIsLoading(false);
      return;
    }

    async function fetchStatus() {
      try {
        const res = await fetch(`/api/v1/payments/orders/${cleanOrderCode}/status`);
        if (res.ok) {
          const data = await res.json();
          setOrderData(data);
        } else {
          setError("Không thể tra cứu thông tin thanh toán từ hệ thống.");
        }
      } catch (err: any) {
        setError(err.message || "Lỗi kết nối");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatus();
  }, [cleanOrderCode]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {isLoading ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center shadow-sm">
          <div className="w-12 h-12 border-4 border-brand-blue-200 border-t-brand-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-700">Đang đối soát kết quả giao dịch từ Cổng MoMo...</p>
        </div>
      ) : isSuccess ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50/50">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Thanh toán MoMo thành công
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Giao dịch thanh toán được xác nhận!
          </h1>

          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
            Hệ thống nhà thuốc H4CARE đã nhận đủ số tiền thanh toán từ Ví điện tử MoMo. Đơn thuốc của quý khách đã chuyển sang trạng thái sẵn sàng xuất kho theo tiêu chuẩn FEFO.
          </p>

          {/* Details Card */}
          <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-sm">
              <span className="text-slate-500">Mã đơn hàng:</span>
              <span className="font-mono font-bold text-brand-blue-700 text-base">
                {orderData?.order_code || cleanOrderCode}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Cổng thanh toán:</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-pink-700 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200 text-xs">
                Ví điện tử MoMo Sandbox
              </span>
            </div>

            {(transId || orderData?.transaction?.partner_trans_id) && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Mã giao dịch MoMo:</span>
                <span className="font-mono text-xs text-slate-800 font-semibold">
                  {transId || orderData?.transaction?.partner_trans_id}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Trạng thái thanh toán:</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ĐÃ THANH TOÁN (PAID)
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-base">
              <span className="font-bold text-slate-900">Số tiền đã quyết toán:</span>
              <span className="font-black text-rose-600 text-lg">
                {(orderData?.total_amount || (amountStr ? Number(amountStr) : 0)).toLocaleString("vi-VN")} đ
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/account?order=${encodeURIComponent(cleanOrderCode)}`}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>Xem tiến độ đơn thuốc</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/products"
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Tiếp tục mua sắm</span>
            </Link>
          </div>
        </div>
      ) : (
        /* FAILED OR CANCELLED SCREEN */
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center">
          <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-6 ring-8 ring-rose-50/50">
            <XCircle className="w-10 h-10" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 mb-3">
            Giao dịch chưa hoàn tất
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Thanh toán chưa thành công
          </h1>

          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
            {message || "Giao dịch qua cổng MoMo đã bị hủy hoặc gặp sự cố kết nối. Đơn thuốc vẫn được giữ tạm ở trạng thái Chờ thanh toán."}
          </p>

          <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Mã đơn hàng:</span>
              <span className="font-mono font-bold text-slate-800">{cleanOrderCode || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phương thức:</span>
              <span className="font-semibold text-pink-700">Ví MoMo Sandbox</span>
            </div>
            {resultCode && (
              <div className="flex justify-between">
                <span className="text-slate-500">Mã phản hồi Gateway:</span>
                <span className="font-mono text-xs text-rose-600">{resultCode}</span>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/cart"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Quay lại giỏ hàng thanh toán lại</span>
            </Link>

            <Link
              href="/about-project"
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all"
            >
              Liên hệ Dược sĩ hỗ trợ
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutResultPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="max-w-md mx-auto py-24 text-center text-slate-500 text-sm">
              Đang tải kết quả thanh toán...
            </div>
          }
        >
          <CheckoutResultContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

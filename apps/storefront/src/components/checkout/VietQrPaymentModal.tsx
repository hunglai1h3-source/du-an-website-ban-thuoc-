"use client";

import React, { useState } from "react";
import {
  QrCode,
  Copy,
  Check,
  Download,
  CheckCircle2,
  X,
  CreditCard,
  Building,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface VietQrPaymentModalProps {
  isOpen: boolean;
  orderCode: string;
  amount: number;
  customerName: string;
  onClose: () => void;
  onConfirmPaid: () => void;
}

export default function VietQrPaymentModal({
  isOpen,
  orderCode,
  amount,
  customerName,
  onClose,
  onConfirmPaid,
}: VietQrPaymentModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const bankName = "MBBank (Ngân hàng TMCP Quân Đội)";
  const accountNumber = "0901234567";
  const accountHolder = "NHA THUOC PHARMATRUST";
  const transferContent = orderCode;

  // Real Napas 247 VietQR standard URL
  const vietQrUrl = `https://img.vietqr.io/image/MB-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
    transferContent
  )}&accountName=${encodeURIComponent(accountHolder)}`;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-blue-700 via-brand-blue-800 to-indigo-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <QrCode className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-300/30">
                  Napas 247 • VietQR Chuẩn Quốc Gia
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Quét Mã QR Chuyển Khoản Ngân Hàng
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* QR Image Box */}
          <div className="text-center bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="inline-block bg-white p-2.5 rounded-2xl shadow-md border border-slate-100">
              <img
                src={vietQrUrl}
                alt="VietQR Chuyển khoản"
                className="w-52 h-52 sm:w-56 sm:h-56 object-contain mx-auto rounded-xl"
              />
            </div>

            <div className="mt-2.5 flex items-center justify-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Số tiền thanh toán:</span>
              <span className="text-lg sm:text-xl font-black text-rose-600 font-mono">
                {amount.toLocaleString("vi-VN")} đ
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mt-1">
              Quét bằng ứng dụng <strong>bất kỳ ngân hàng nào</strong> (Vietcombank, MB, Techcombank, BIDV, VPBank,...)
            </p>
          </div>

          {/* Bank Transfer Details with 1-click copy */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <span>Thông tin tài khoản nhận tiền</span>
              <span className="text-brand-blue-600 font-normal">Bấm biểu tượng để sao chép</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 shadow-2xs">
              {/* Ngân hàng */}
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
                <span className="font-bold text-slate-900">{bankName}</span>
              </div>

              {/* Số tài khoản */}
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-brand-blue-700 text-sm">{accountNumber}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(accountNumber, "accountNumber")}
                    className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Sao chép số tài khoản"
                  >
                    {copiedField === "accountNumber" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Chủ tài khoản */}
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <span className="font-bold text-slate-900">{accountHolder}</span>
              </div>

              {/* Nội dung chuyển khoản */}
              <div className="flex items-center justify-between py-1 bg-amber-50/70 p-2 rounded-lg border border-amber-200/80">
                <div>
                  <span className="text-amber-800 font-bold block text-[11px]">Nội dung chuyển khoản (bắt buộc):</span>
                  <span className="font-mono font-black text-amber-900 text-xs">{transferContent}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(transferContent, "transferContent")}
                  className="px-2 py-1 rounded-md bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-[10px] transition-colors flex items-center gap-1"
                >
                  {copiedField === "transferContent" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-700" />
                      <span>Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-[11px] text-blue-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-blue-600" />
              <span>Giao dịch an toàn & Xác nhận tức thì</span>
            </div>
            <p className="text-blue-800 leading-relaxed">
              Sau khi bạn quét mã chuyển khoản thành công, vui lòng nhấn nút xác nhận bên dưới để nhân viên Dược sĩ đóng gói đơn thuốc và xuất hóa đơn điện tử cho bạn.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2 shrink-0">
          <a
            href={vietQrUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={`VietQR_${orderCode}.png`}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Tải ảnh mã QR</span>
          </a>

          <button
            type="button"
            onClick={onConfirmPaid}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Tôi đã chuyển khoản thành công</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

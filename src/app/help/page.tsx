"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  HelpCircle,
  PhoneCall,
  ShieldCheck,
  Truck,
  RotateCcw,
  FileText,
  ChevronDown,
  ArrowRight,
  Stethoscope,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const FAQS = [
  {
    q: "Làm thế nào để mua thuốc kê đơn (Rx) tại H4CARE?",
    a: "Theo quy định của Bộ Y Tế, các thuốc kê đơn (Rx) bắt buộc phải có đơn thuốc hợp lệ từ Bác sĩ. Bạn chỉ cần chụp ảnh toa thuốc và gửi tại trang 'Gửi Đơn Thuốc' (/prescription). Dược sĩ Đại học H4CARE sẽ liên hệ xác nhận liều dùng và hướng dẫn cấp phát thuốc an toàn.",
  },
  {
    q: "Chính sách giao hàng hỏa tốc 2 giờ hoạt động như thế nào?",
    a: "Đơn hàng trong khu vực nội thành sẽ được hệ thống nhà thuốc H4CARE gần nhất tiếp nhận, đóng gói theo tiêu chuẩn bảo quản thuốc GSP và giao tận nơi trong vòng 2 giờ. Đơn hàng từ 300.000đ được MIỄN PHÍ VẬN CHUYỂN toàn quốc.",
  },
  {
    q: "Chính sách đổi trả thuốc 30 ngày áp dụng ra sao?",
    a: "H4CARE hỗ trợ đổi trả thuốc tận nhà trong 30 ngày đối với các sản phẩm còn nguyên vẹn tem niêm phong, hoặc sản phẩm có lỗi bao bì, cận date hoặc sai sót trong quá trình cấp phát. Bạn chỉ cần gọi hotline 1800 6868 để nhân viên đến hỗ trợ tận nhà.",
  },
  {
    q: "Làm sao để tích điểm thành viên và dùng điểm giảm giá?",
    a: "Mỗi đơn hàng thành công khi bạn đăng nhập tài khoản H4CARE sẽ được tự động tích lũy 2% giá trị đơn hàng. Điểm này có thể quy đổi để giảm trực tiếp vào các lần mua thuốc tiếp theo.",
  },
  {
    q: "Thuốc tại H4CARE có xuất hóa đơn đỏ (VAT) không?",
    a: "100% sản phẩm tại H4CARE đều là hàng chính hãng có đầy đủ hóa đơn chứng từ hợp pháp. Bạn có thể yêu cầu xuất hóa đơn điện tử VAT khi điền thông tin thanh toán đơn hàng.",
  },
];

export default function HelpPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Hero Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center mx-auto mb-2">
            <HelpCircle className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Trung Tâm Hỗ Trợ Y Khoa & Khách Hàng
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            H4CARE luôn đồng hành cùng bạn 24/7 để giải đáp mọi thắc mắc về quy trình cấp phát thuốc, hướng dẫn sử dụng và chính sách dịch vụ.
          </p>
        </div>

        {/* 3 Core Trust Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <ShieldCheck className="w-6 h-6 text-brand-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">100% Chuẩn GPP</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Toàn bộ thuốc được kiểm định nguồn gốc xuất xứ và có số đăng ký lưu hành Bộ Y Tế.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <Truck className="w-6 h-6 text-brand-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Giao Hỏa Tốc 2 Giờ</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bảo quản chuẩn GSP trong túi cách nhiệt chuyên dụng, giao tận tay người bệnh.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <RotateCcw className="w-6 h-6 text-brand-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Đổi Trả 30 Ngày</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Đổi trả miễn phí tận nhà với quy trình minh bạch, bảo vệ tối đa quyền lợi khách hàng.
            </p>
          </div>
        </div>

        {/* FAQs Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-blue-600" />
            <span>Câu Hỏi Thường Gặp (FAQs)</span>
          </h2>

          <div className="divide-y divide-slate-100">
            {FAQS.map((faq, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div key={idx} className="py-3.5">
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left font-bold text-xs sm:text-sm text-slate-800 hover:text-brand-blue-600 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-brand-blue-600" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="text-xs text-slate-600 pt-2.5 leading-relaxed">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Direct Contact Banner */}
        <div className="bg-gradient-to-r from-brand-blue-700 to-cyan-700 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-depth-2">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-semibold text-cyan-200 uppercase tracking-wider block">
              Cần tư vấn trực tiếp cùng Dược sĩ?
            </span>
            <h3 className="text-xl font-bold">Tổng đài y tế: 1800 6868 (Miễn phí cước)</h3>
            <p className="text-xs text-cyan-100">
              Phục vụ từ 7:00 - 22:00 tất cả các ngày trong tuần kể cả Lễ, Tết.
            </p>
          </div>

          <a href="tel:18006868" className="shrink-0">
            <Button variant="secondary" size="md" leftIcon={<PhoneCall className="w-4 h-4" />}>
              Gọi Dược Sĩ Ngay
            </Button>
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}

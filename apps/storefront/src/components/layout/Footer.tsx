"use client";

import React from "react";
import Link from "next/link";
import { H4CareLogo } from "../branding/H4CareLogo";
import { FptPolyBadge } from "../branding/FptPolyBadge";
import { PhoneCall, ShieldCheck, Heart, MapPin, Mail, ExternalLink } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-200/90 bg-slate-950 text-slate-400 text-xs select-none">
      {/* Upper Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">
          {/* Col 1 & 2: Brand Identity & Vision */}
          <div className="lg:col-span-2 space-y-4">
            <H4CareLogo variant="white" size="md" withTagline={true} />
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm mt-3">
              Nền tảng tra cứu và tiếp cận dược phẩm số hóa hiện đại. Hỗ trợ tư vấn chuyên môn Dược khoa, cung cấp thông tin minh bạch theo định hướng tiêu chuẩn Thực hành Tốt (GPP & GSP).
            </p>

            {/* Academic Credential Badge */}
            <div className="pt-2">
              <FptPolyBadge variant="dark" />
            </div>

            {/* Hotline consultation pill */}
            <div className="pt-2 flex items-center gap-3">
              <a
                href="tel:18006868"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-brand-blue-500/50 text-cyan-400 hover:text-white transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">1800 6868 (Tư vấn Dược sĩ)</span>
              </a>
            </div>
          </div>

          {/* Col 3: Danh Mục Dược Phẩm */}
          <div className="space-y-3">
            <h4 className="text-slate-200 font-bold text-xs uppercase tracking-wider">
              Danh Mục Sản Phẩm
            </h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <Link href="/category/thuoc-khong-ke-don" className="hover:text-white transition-colors">
                  Thuốc Không Kê Đơn (OTC)
                </Link>
              </li>
              <li>
                <Link href="/category/thuoc-ke-don" className="hover:text-white transition-colors">
                  Thuốc Kê Đơn (Rx)
                </Link>
              </li>
              <li>
                <Link href="/category/thuc-pham-chuc-nang" className="hover:text-white transition-colors">
                  Vitamin & Thực Phẩm Chức Năng
                </Link>
              </li>
              <li>
                <Link href="/category/thiet-bi-y-te" className="hover:text-white transition-colors">
                  Thiết Bị Y Tế & Chăm Sóc
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-cyan-400 transition-colors font-medium">
                  Tất cả sản phẩm →
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Dịch Vụ & Hỗ Trợ */}
          <div className="space-y-3">
            <h4 className="text-slate-200 font-bold text-xs uppercase tracking-wider">
              Dịch Vụ Khách Hàng
            </h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <Link href="/category/thuoc-ke-don" className="hover:text-white transition-colors">
                  Gửi đơn thuốc Bác sĩ
                </Link>
              </li>
              <li>
                <span className="text-slate-500">Tra cứu đơn thuốc điện tử</span>
              </li>
              <li>
                <span className="text-slate-500">Chính sách giao nhận chuẩn GSP</span>
              </li>
              <li>
                <span className="text-slate-500">Chính sách đổi trả linh hoạt</span>
              </li>
              <li>
                <span className="text-slate-500">Bảo mật thông tin bệnh án</span>
              </li>
            </ul>
          </div>

          {/* Col 5: Về Dự Án & Học Thuật */}
          <div className="space-y-3">
            <h4 className="text-slate-200 font-bold text-xs uppercase tracking-wider">
              Thông Tin Đồ Án
            </h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <span className="text-slate-300 font-medium block">
                  FPT Polytechnic
                </span>
                <span className="text-slate-500 text-[11px]">
                  Khoa Công Nghệ Thông Tin
                </span>
              </li>
              <li className="pt-1">
                <span className="text-slate-400 block text-[11px]">
                  Nhóm sinh viên thực hiện:
                </span>
                <span className="text-slate-300 font-medium">
                  Hùng • Đức Anh • Hoàn • Cường
                </span>
              </li>
              <li className="pt-2">
                <Link
                  href="/about-project"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold border border-slate-800 transition-colors"
                >
                  <span>Hồ sơ & Báo cáo kỹ thuật</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Ethical Standards Ribbon */}
      <div className="border-t border-slate-900 bg-slate-950 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-brand-emerald-500 shrink-0" />
            <span>
              © 2026 H4CARE. Dự án mô phỏng E-Commerce Dược Phẩm Cao Cấp • Tuân thủ chuẩn thông tin y tế.
            </span>
          </div>

          <div className="text-slate-400 text-[11px]">
            Đồ án tốt nghiệp • FPT Polytechnic
          </div>
        </div>
      </div>
    </footer>
  );
};

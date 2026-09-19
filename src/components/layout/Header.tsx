"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { H4CareLogo } from "../branding/H4CareLogo";
import { FptPolyBadge } from "../branding/FptPolyBadge";
import { MegaMenu } from "./MegaMenu";
import { SearchExperience } from "./SearchExperience";
import { MobileDrawer } from "./MobileDrawer";
import { MobileBottomNav } from "./MobileBottomNav";
import {
  LayoutGrid,
  PhoneCall,
  ShoppingBag,
  User,
  ChevronDown,
  Menu,
  ShieldCheck,
  RotateCcw,
  Search,
} from "lucide-react";

interface HeaderProps {
  onReplayIntro?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReplayIntro }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState(2); // Demo mock count

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Top Academic & Medical Trust Bar - Sleek & Secondary */}
      <div className="bg-slate-950 text-slate-400 text-[11px] py-1 px-4 hidden md:block border-b border-slate-900 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FptPolyBadge variant="dark" />
            <span className="text-slate-700">/</span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald-500" />
              <span>Hệ thống Dược phẩm H4CARE • Định hướng chuẩn GPP & GSP</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="tel:18006868"
              className="flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 font-medium transition-colors"
            >
              <PhoneCall className="w-3 h-3 text-cyan-400" />
              <span>Tư vấn Dược sĩ: 1800 6868 (Miễn cước)</span>
            </a>

            {onReplayIntro && (
              <button
                onClick={onReplayIntro}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer text-[10.5px]"
                title="Xem lại hiệu ứng mở đầu"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Xem Intro</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Sticky Header with Balanced Depth */}
      <header
        className={`sticky top-0 z-40 transition-all duration-200 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-xl shadow-depth-2 py-2 border-b border-slate-200/80"
            : "bg-white/98 backdrop-blur-md py-2.5 sm:py-3 border-b border-slate-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 md:gap-5">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="p-2 -ml-2 rounded-xl text-slate-700 hover:bg-slate-100 lg:hidden focus:outline-none transition-colors"
              aria-label="Mở menu di động"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* H4CARE Primary Brand Identity */}
            <div className="shrink-0 flex items-center">
              <H4CareLogo size={isScrolled ? "sm" : "md"} withTagline={!isScrolled} />
            </div>

            {/* Mega Menu Button (Desktop) */}
            <div className="hidden lg:block relative shrink-0">
              <button
                onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                aria-expanded={isMegaMenuOpen}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-[13px] transition-all duration-150 active:scale-95 ${
                  isMegaMenuOpen
                    ? "bg-brand-blue-600 text-white shadow-depth-1"
                    : "bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 border border-slate-200/60"
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-brand-blue-600" />
                <span>Danh mục thuốc</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    isMegaMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {/* Central Interactive Search (Desktop & Tablet) */}
            <div className="flex-1 max-w-2xl hidden md:block">
              <SearchExperience />
            </div>

            {/* Right Action Navigation */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Mobile Search Trigger */}
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                className="p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 md:hidden transition-colors"
                aria-label="Tìm kiếm thuốc"
              >
                <Search className="w-5 h-5 text-slate-600" />
              </button>

              {/* Consultation Hotline Pill - Minimalist on xl */}
              <a
                href="tel:18006868"
                className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200/80 hover:border-brand-blue-200 bg-slate-50/50 hover:bg-brand-blue-50/40 text-slate-700 transition-all duration-150"
                title="Gọi tư vấn Dược sĩ miễn cước"
              >
                <div className="w-6 h-6 rounded-lg bg-brand-blue-100/60 text-brand-blue-600 flex items-center justify-center shrink-0">
                  <PhoneCall className="w-3.5 h-3.5" />
                </div>
                <div className="text-left leading-none">
                  <span className="text-[10px] text-slate-400 block font-normal">Tư vấn Dược sĩ</span>
                  <span className="text-xs font-bold text-slate-800">1800 6868</span>
                </div>
              </a>

              {/* Account Dropdown Trigger */}
              <Link
                href="/account"
                className="hidden sm:flex items-center gap-2 p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
                title="Tài khoản cá nhân"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200/60 text-slate-600 hover:text-brand-blue-600">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden 2xl:block text-left leading-none">
                  <span className="text-[10px] text-slate-400 block font-normal">Thành viên</span>
                  <span className="text-xs font-bold text-slate-800">Tài khoản</span>
                </div>
              </Link>

              {/* Cart Button with Count Badge */}
              <Link
                href="/cart"
                className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-brand-blue-50 text-brand-blue-700 hover:bg-brand-blue-100/80 border border-brand-blue-100 transition-all duration-150 group active:scale-95"
                title="Giỏ hàng H4CARE"
              >
                <ShoppingBag className="w-4.5 h-4.5 group-hover:scale-110 transition-transform duration-150" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Mega Menu Popover */}
        <MegaMenu isOpen={isMegaMenuOpen} onClose={() => setIsMegaMenuOpen(false)} />
      </header>

      {/* Mobile Drawer Menu */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      />

      {/* Mobile Search Modal Popover */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 pt-16 md:hidden">
          <div className="bg-white rounded-3xl p-4 shadow-depth-4">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-900">Tìm kiếm thuốc & thiết bị y tế</span>
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                Đóng
              </button>
            </div>
            <SearchExperience
              isMobileModal={true}
              onCloseMobileModal={() => setIsMobileSearchOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        onOpenCategories={() => setIsMobileDrawerOpen(true)}
        onOpenSearch={() => setIsMobileSearchOpen(true)}
      />
    </>
  );
};

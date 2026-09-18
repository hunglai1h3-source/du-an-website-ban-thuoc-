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
      if (window.scrollY > 20) {
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
      {/* Top Academic & Medical Trust Bar */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4 hidden md:block border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FptPolyBadge variant="dark" className="py-0.5 px-2.5 text-[10px]" />
            <span className="text-slate-400">|</span>
            <div className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald-400" />
              <span>Hệ thống Dược phẩm Trực tuyến Chuẩn Y Khoa GPP</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <a
              href="tel:18006868"
              className="flex items-center gap-1.5 text-cyan-300 hover:text-white font-medium transition-colors"
            >
              <PhoneCall className="w-3 h-3" />
              <span>Tổng đài Miễn cước: 1800 6868 (07:00 - 22:00)</span>
            </a>

            {onReplayIntro && (
              <button
                onClick={onReplayIntro}
                className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                title="Xem lại hiệu ứng mở đầu"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Xem Intro</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-white/90 backdrop-blur-xl shadow-medical py-2.5 border-b border-slate-200/80"
            : "bg-white/95 backdrop-blur-md py-3.5 border-b border-slate-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 md:gap-6">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="p-2 -ml-2 rounded-xl text-slate-700 hover:bg-slate-100 lg:hidden focus:outline-none"
              aria-label="Mở menu di động"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* H4CARE Logo */}
            <div className="shrink-0 flex items-center">
              <H4CareLogo size={isScrolled ? "sm" : "md"} withTagline={!isScrolled} />
            </div>

            {/* Mega Menu Button (Desktop) */}
            <div className="hidden lg:block relative">
              <button
                onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                  isMegaMenuOpen
                    ? "bg-brand-blue-600 text-white shadow-md shadow-brand-blue-500/20"
                    : "bg-brand-blue-50/80 hover:bg-brand-blue-100/70 text-brand-blue-700 border border-brand-blue-100"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Danh mục</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isMegaMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {/* Central Interactive Search (Desktop & Tablet) */}
            <div className="flex-1 max-w-2xl hidden md:block">
              <SearchExperience />
            </div>

            {/* Right Action Icons & Hotline */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Mobile Search Button */}
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                className="p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 md:hidden"
                aria-label="Tìm kiếm"
              >
                <Search className="w-5 h-5 text-slate-600" />
              </button>

              {/* Consultation Hotline Pill (Desktop) */}
              <div className="hidden xl:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/60">
                <div className="w-8 h-8 rounded-xl bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div className="text-left leading-tight">
                  <span className="text-[10px] text-slate-500 font-medium block">Tư vấn miễn phí</span>
                  <a href="tel:18006868" className="text-xs font-bold text-slate-800 hover:text-brand-blue-600">
                    1800 6868
                  </a>
                </div>
              </div>

              {/* Account Dropdown Trigger */}
              <div className="hidden sm:flex items-center">
                <Link
                  href="/account"
                  className="flex items-center gap-2 p-2 rounded-xl text-slate-700 hover:text-brand-blue-600 hover:bg-slate-100 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200/60">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="hidden 2xl:block text-left">
                    <span className="text-[11px] text-slate-400 block font-normal">Xin chào,</span>
                    <span className="text-xs font-bold text-slate-800">Tài khoản</span>
                  </div>
                </Link>
              </div>

              {/* Cart Button with Count Badge */}
              <Link
                href="/cart"
                className="relative flex items-center justify-center p-2.5 rounded-2xl bg-brand-blue-50 text-brand-blue-700 hover:bg-brand-blue-100 border border-brand-blue-100 transition-all duration-200 group active:scale-95"
                title="Giỏ hàng H4CARE"
              >
                <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm ring-2 ring-white animate-pulse-subtle">
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
          <div className="bg-white rounded-3xl p-4 shadow-2xl">
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

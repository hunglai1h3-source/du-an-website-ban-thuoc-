"use client";

import React, { useState } from "react";
import Link from "next/link";
import { H4CareLogo } from "../branding/H4CareLogo";
import { FptPolyBadge } from "../branding/FptPolyBadge";
import { CATEGORIES_DATA } from "@/data/mockData";
import {
  X,
  PhoneCall,
  ShieldCheck,
  ChevronDown,
  User,
  Heart,
  FileText,
  HelpCircle,
  Stethoscope,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const toggleCat = (id: string) => {
    setExpandedCat(expandedCat === id ? null : id);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 lg:hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        />

        {/* Drawer panel */}
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-0 bottom-0 left-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col justify-between overflow-y-auto"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
            <H4CareLogo size="sm" withTagline={true} />
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-5 flex-1">
            {/* Pharmacist Quick Call Bar */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-brand-blue-50 to-brand-cyan-50 border border-brand-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-blue-600 text-white flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-blue-950">Tư vấn Dược sĩ 24/7</p>
                  <a
                    href="tel:18006868"
                    className="text-sm font-extrabold text-brand-blue-600 flex items-center gap-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>1800 6868 (Miễn phí)</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Category Accordion */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Danh mục y tế & dược phẩm
              </p>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {CATEGORIES_DATA.map((cat) => {
                  const isExpanded = expandedCat === cat.id;
                  return (
                    <div key={cat.id}>
                      <button
                        onClick={() => toggleCat(cat.id)}
                        className="w-full flex items-center justify-between p-3.5 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span>{cat.name}</span>
                          {cat.badge && (
                            <span className="text-[10px] bg-brand-blue-50 text-brand-blue-600 px-1.5 py-0.2 rounded font-bold">
                              {cat.badge}
                            </span>
                          )}
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                            isExpanded ? "rotate-180 text-brand-blue-600" : ""
                          }`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="bg-slate-50/80 px-4 py-2 space-y-1.5">
                          {cat.subCategories.map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/categories/${cat.slug}/${sub.slug}`}
                              onClick={onClose}
                              className="block py-1.5 text-xs text-slate-600 hover:text-brand-blue-600 pl-3 border-l-2 border-slate-200 hover:border-brand-blue-600"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick links */}
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Tiện ích thành viên
              </p>
              <Link
                href="/account"
                onClick={onClose}
                className="flex items-center gap-3 p-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>Tài khoản của tôi</span>
              </Link>
              <Link
                href="/prescription"
                onClick={onClose}
                className="flex items-center gap-3 p-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Gửi đơn thuốc theo toa</span>
              </Link>
              <Link
                href="/wishlist"
                onClick={onClose}
                className="flex items-center gap-3 p-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <Heart className="w-4 h-4 text-slate-400" />
                <span>Sản phẩm quan tâm</span>
              </Link>
              <Link
                href="/help"
                onClick={onClose}
                className="flex items-center gap-3 p-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Trung tâm trợ giúp & chính sách</span>
              </Link>
            </div>
          </div>

          {/* Footer of Drawer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/60">
            <FptPolyBadge variant="light" className="w-full justify-center mb-2" />
            <p className="text-[11px] text-center text-slate-400">
              H4CARE Healthcare • 2026 Edition
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

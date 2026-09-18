"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, X, Clock, TrendingUp, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { RECENT_SEARCHES, TRENDING_KEYWORDS, SUGGESTED_PRODUCTS } from "@/data/mockData";
import { formatVND } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SearchExperienceProps {
  onSearchSubmit?: (query: string) => void;
  className?: string;
  isMobileModal?: boolean;
  onCloseMobileModal?: () => void;
}

export const SearchExperience: React.FC<SearchExperienceProps> = ({
  onSearchSubmit,
  className = "",
  isMobileModal = false,
  onCloseMobileModal,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(RECENT_SEARCHES);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !isMobileModal
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        if (onCloseMobileModal) onCloseMobileModal();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileModal, onCloseMobileModal]);

  const handleSelectKeyword = (kw: string) => {
    setQuery(kw);
    if (!recentSearches.includes(kw)) {
      setRecentSearches((prev) => [kw, ...prev.slice(0, 4)]);
    }
    if (onSearchSubmit) onSearchSubmit(kw);
    setIsOpen(false);
    if (onCloseMobileModal) onCloseMobileModal();
  };

  const removeRecent = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setRecentSearches((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Bar */}
      <div
        className={`relative flex items-center w-full transition-all duration-300 rounded-2xl ${
          isOpen
            ? "ring-2 ring-brand-blue-500/80 shadow-medical-glow bg-white"
            : "bg-slate-100/90 hover:bg-slate-100 border border-slate-200/80 shadow-sm"
        }`}
      >
        <div className="pl-4 pr-2 text-slate-400">
          <Search className={`w-4 h-4 transition-colors ${isOpen ? "text-brand-blue-600" : ""}`} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          placeholder="Tìm tên thuốc, triệu chứng, hoạt chất, vitamin..."
          className="w-full py-2.5 pr-10 text-sm bg-transparent outline-none text-slate-800 placeholder:text-slate-400 font-medium"
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="p-1 mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="hidden sm:flex items-center gap-1 mr-3 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200/60 text-slate-500 border border-slate-300/40">
            <span>Tìm kiếm</span>
          </div>
        )}
      </div>

      {/* Suggestion Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.99 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute left-0 right-0 mt-2 z-50 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-medical-lg overflow-hidden ${
              isMobileModal ? "static mt-4 shadow-none border-0" : "max-h-[580px] overflow-y-auto"
            }`}
          >
            <div className="p-4 divide-y divide-slate-100">
              {/* 1. Lịch sử tìm kiếm gần đây */}
              {recentSearches.length > 0 && (
                <div className="pb-3">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-brand-blue-500" />
                      <span>Tìm kiếm gần đây</span>
                    </div>
                    <button
                      onClick={clearAllRecent}
                      className="text-xs text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      Xóa tất cả
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((item, idx) => (
                      <span
                        key={idx}
                        onClick={() => handleSelectKeyword(item)}
                        className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-slate-100/90 hover:bg-brand-blue-50 text-slate-700 hover:text-brand-blue-700 border border-slate-200/60 hover:border-brand-blue-200 cursor-pointer transition-all duration-150"
                      >
                        <span>{item}</span>
                        <X
                          onClick={(e) => removeRecent(e, idx)}
                          className="w-3 h-3 text-slate-400 group-hover:text-slate-600 hover:text-rose-500"
                        />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Từ khóa thịnh hành */}
              <div className="py-3">
                <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <TrendingUp className="w-3.5 h-3.5 text-brand-cyan-500" />
                  <span>Xu hướng tìm kiếm hôm nay</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_KEYWORDS.map((keyword, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectKeyword(keyword)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 border border-slate-200/70 hover:border-cyan-200 transition-all duration-150"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-500" />
                      <span>{keyword}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Sản phẩm gợi ý nhanh */}
              <div className="pt-3">
                <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald-500" />
                    <span>Sản phẩm dược phẩm nổi bật</span>
                  </div>
                  <span className="text-[11px] text-brand-blue-600 font-medium cursor-pointer hover:underline">
                    Xem tất cả 10.000+ sản phẩm
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SUGGESTED_PRODUCTS.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => handleSelectKeyword(prod.title)}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-brand-blue-200 hover:bg-brand-blue-50/40 cursor-pointer transition-all duration-200 group"
                    >
                      <div className="w-12 h-12 rounded-lg bg-white border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                        <img
                          src={prod.image}
                          alt={prod.title}
                          className="w-full h-full object-cover rounded group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-medium text-slate-400 uppercase truncate">
                            {prod.brand}
                          </span>
                          {prod.badge && (
                            <span className="text-[9px] font-semibold text-brand-blue-600 bg-brand-blue-50 px-1.5 py-0.2 rounded">
                              {prod.badge}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-medium text-slate-800 line-clamp-1 group-hover:text-brand-blue-600 transition-colors">
                          {prod.title}
                        </h4>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-xs font-bold text-brand-blue-700">
                            {formatVND(prod.price || 0)}
                          </span>
                          {prod.originalPrice && (
                            <span className="text-[10px] text-slate-400 line-through">
                              {formatVND(prod.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom fast consultation hint */}
              <div className="pt-3 mt-3 flex items-center justify-between text-xs text-slate-500 bg-gradient-to-r from-blue-50/60 to-cyan-50/60 -mx-4 -mb-4 p-3 border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Dược sĩ H4CARE đang trực tuyến: Hỗ trợ tìm thuốc theo toa ngay
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-brand-blue-600 hover:underline cursor-pointer">
                  <span>Chat với dược sĩ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Clock, TrendingUp, Sparkles, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { RECENT_SEARCHES, TRENDING_KEYWORDS } from "@/data/mockData";
import { PRODUCTS_DATA } from "@/data/products";
import { Product } from "@/types";
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
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(RECENT_SEARCHES);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Live filter products based on query
  const liveResults: Product[] = useMemo(() => {
    if (!debouncedQuery) return [];
    return PRODUCTS_DATA.filter((p) => {
      const q = debouncedQuery;
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.activeIngredient.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.usage.toLowerCase().includes(q)
      );
    }).slice(0, 4);
  }, [debouncedQuery]);

  // Close when clicking outside or pressing Escape
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
    router.push(`/products?search=${encodeURIComponent(kw)}`);
  };

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      handleSelectKeyword(query.trim());
    }
  };

  const handleSelectProduct = (product: Product) => {
    setIsOpen(false);
    if (onCloseMobileModal) onCloseMobileModal();
    router.push(`/product/${product.slug}`);
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
        className={`relative flex items-center w-full transition-all duration-200 rounded-2xl ${
          isOpen
            ? "ring-2 ring-brand-blue-500/80 shadow-depth-2 bg-white"
            : "bg-slate-100/90 hover:bg-slate-100/70 border border-slate-200/80 shadow-sm"
        }`}
      >
        <div className="pl-4 pr-2 text-slate-400">
          <Search
            className={`w-4 h-4 transition-colors duration-150 ${
              isOpen ? "text-brand-blue-600" : ""
            }`}
          />
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
          onKeyDown={handleKeyDownInput}
          placeholder="Tìm tên thuốc, hoạt chất, triệu chứng, vitamin..."
          className="w-full py-2.5 pr-10 text-xs sm:text-sm bg-transparent outline-none text-slate-800 placeholder:text-slate-400 font-medium"
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="p-1 mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="hidden sm:flex items-center gap-1 mr-3 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200/70 text-slate-500 border border-slate-300/50">
            <span>Enter</span>
          </div>
        )}
      </div>

      {/* Suggestion Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.99 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute left-0 right-0 mt-2 z-50 rounded-2xl bg-white/98 backdrop-blur-xl border border-slate-200/90 shadow-depth-3 overflow-hidden ${
              isMobileModal ? "static mt-4 shadow-none border-0" : "max-h-[560px] overflow-y-auto"
            }`}
          >
            <div className="p-4 divide-y divide-slate-100">
              {/* 1. Live Search Results if typing */}
              {debouncedQuery ? (
                <div className="pb-3">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <Search className="w-3.5 h-3.5 text-brand-blue-600" />
                      <span>Kết quả tìm kiếm cho &ldquo;{query}&rdquo;</span>
                    </div>
                    <span className="text-[11px] font-semibold text-brand-blue-600">
                      {liveResults.length} sản phẩm
                    </span>
                  </div>

                  {liveResults.length > 0 ? (
                    <div className="space-y-2">
                      {liveResults.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => handleSelectProduct(prod)}
                          className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-brand-blue-200 hover:bg-brand-blue-50/40 cursor-pointer transition-all duration-150 group"
                        >
                          <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center p-1">
                            <img
                              src={prod.images[0]}
                              alt={prod.name}
                              className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                                {prod.brand}
                              </span>
                              {prod.isPrescription ? (
                                <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                  Thuốc kê đơn (Rx)
                                </span>
                              ) : (
                                <span className="text-[9px] font-semibold text-brand-blue-600 bg-brand-blue-50 px-1.5 py-0.2 rounded">
                                  {prod.categoryName}
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-semibold text-slate-800 line-clamp-1 group-hover:text-brand-blue-600 transition-colors">
                              {prod.name}
                            </h4>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <span className="text-xs font-black text-brand-blue-700">
                                {formatVND(prod.salePrice || prod.price)}
                              </span>
                              {prod.salePrice && (
                                <span className="text-[10px] text-slate-400 line-through">
                                  {formatVND(prod.price)}
                                </span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-500 space-y-2">
                      <AlertCircle className="w-6 h-6 mx-auto text-slate-400" />
                      <p className="text-xs font-medium">
                        Không tìm thấy sản phẩm khớp với &ldquo;{query}&rdquo;
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Thử tìm với tên thông thường như: Panadol, Vitamin C, Berocca...
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* 2. Lịch sử tìm kiếm gần đây */}
                  {recentSearches.length > 0 && (
                    <div className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <Clock className="w-3.5 h-3.5 text-brand-blue-500" />
                          <span>Tìm kiếm gần đây</span>
                        </div>
                        <button
                          onClick={clearAllRecent}
                          className="text-[11px] text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          Xóa tất cả
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
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

                  {/* 3. Từ khóa thịnh hành */}
                  <div className="py-3">
                    <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <TrendingUp className="w-3.5 h-3.5 text-brand-cyan-500" />
                      <span>Xu hướng tìm kiếm hôm nay</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {TRENDING_KEYWORDS.map((keyword, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectKeyword(keyword)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium bg-slate-50 hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 border border-slate-200/70 hover:border-cyan-200 transition-all duration-150 active:scale-95"
                        >
                          <Sparkles className="w-3 h-3 text-cyan-500" />
                          <span>{keyword}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Dược phẩm tiêu biểu */}
                  <div className="pt-3">
                    <div className="flex items-center justify-between mb-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald-500" />
                        <span>Sản phẩm dược phẩm nổi bật</span>
                      </div>
                      <span
                        onClick={() => {
                          setIsOpen(false);
                          router.push("/products");
                        }}
                        className="text-[11px] text-brand-blue-600 font-semibold cursor-pointer hover:underline"
                      >
                        Xem tất cả
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {PRODUCTS_DATA.slice(0, 4).map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => handleSelectProduct(prod)}
                          className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-100 hover:border-brand-blue-200 hover:bg-brand-blue-50/40 cursor-pointer transition-all duration-150 group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200/70 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                            <img
                              src={prod.images[0]}
                              alt={prod.name}
                              className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-slate-800 line-clamp-1 group-hover:text-brand-blue-600 transition-colors">
                              {prod.name}
                            </h4>
                            <span className="text-xs font-bold text-brand-blue-700">
                              {formatVND(prod.salePrice || prod.price)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Bottom fast consultation hint */}
              <div className="pt-3 mt-3 flex items-center justify-between text-xs text-slate-500 bg-gradient-to-r from-blue-50/70 to-cyan-50/70 -mx-4 -mb-4 p-3 border-t border-slate-100">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Dược sĩ H4CARE đang trực tuyến
                </span>
                <span
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/category/thuoc-ke-don");
                  }}
                  className="inline-flex items-center gap-1 font-bold text-brand-blue-600 hover:underline cursor-pointer text-[11px]"
                >
                  <span>Gửi đơn thuốc theo toa</span>
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

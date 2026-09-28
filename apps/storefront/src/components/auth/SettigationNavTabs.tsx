"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Lock, Smartphone, ShieldCheck, Sparkles } from "lucide-react";

export interface SettigationNavTabItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
}

interface SettigationNavTabsProps {
  tabs: SettigationNavTabItem[];
  activeTab: string;
  onTabChange: (id: string, direction: number) => void;
  className?: string;
}

/**
 * H4CARE Settigation Navigation Tabs Component
 * Direct implementation of Settigation's signature "Smooth Navigation Tabs UI"
 * (Reference: https://vt.tiktok.com/ZSbY7duwy/):
 * - Gliding spring pill active indicator using Framer Motion layoutId
 * - Specular liquid glass top border highlight
 * - Fluid hover micro-interactions
 * - Responsive capsule architecture
 */
export const SettigationNavTabs: React.FC<SettigationNavTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}) => {
  const shouldReduceMotion = useReducedMotion();

  const handleSelect = (selectedId: string) => {
    if (selectedId === activeTab) return;
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    const newIndex = tabs.findIndex((t) => t.id === selectedId);
    const direction = newIndex > currentIndex ? 1 : -1;
    onTabChange(selectedId, direction);
  };

  return (
    <div
      role="tablist"
      aria-label="Phương thức đăng nhập H4CARE"
      className={`relative w-full max-w-sm mx-auto p-1.5 rounded-full bg-[#08152e]/80 border border-white/[0.12] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,18,50,0.6)] flex items-center justify-between select-none ${className}`}
    >
      {/* Top subtle specular edge */}
      <div className="absolute top-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => handleSelect(tab.id)}
            className={`relative flex-1 py-2 sm:py-2.5 px-3 rounded-full flex items-center justify-center gap-2 text-xs sm:text-[13px] font-bold transition-colors duration-200 focus:outline-none cursor-pointer z-10 ${
              isActive
                ? "text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
            }`}
          >
            {/* GLIDING ACTIVE TAB INDICATOR PILL */}
            {isActive && (
              <motion.div
                layoutId="settigationActiveTabPill"
                transition={
                  shouldReduceMotion
                    ? { duration: 0.15 }
                    : {
                        type: "spring",
                        stiffness: 420,
                        damping: 32,
                        mass: 0.8,
                      }
                }
                className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 shadow-[0_4px_20px_rgba(6,182,212,0.35)] -z-10"
              >
                {/* Specular Chrome Highlight on Pill Top */}
                <div className="absolute top-0 inset-x-3 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-90" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 via-transparent to-black/20" />
              </motion.div>
            )}

            {/* Icon with micro-scale reaction */}
            <span
              className={`transition-transform duration-200 shrink-0 ${
                isActive ? "scale-110 text-cyan-200" : "text-slate-400"
              }`}
            >
              {tab.icon}
            </span>

            {/* Tab Label */}
            <span className="tracking-tight truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

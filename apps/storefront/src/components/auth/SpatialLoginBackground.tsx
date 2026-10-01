"use client";

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface SpatialLoginBackgroundProps {
  mouseParallax?: { x: number; y: number };
  variant?: "light-sea" | "obsidian";
}

/**
 * H4CARE Spatial Atmospheric Background
 * Translates the high-end Settigation motion language into a clean,
 * deeply trusted clinical healthcare aesthetic:
 * - Light Sea Blue ("Xanh nước biển nhạt") / Marine Aqua theme (#ebf5fb -> #e0f2fe)
 * - Multi-layer radial oceanic cyan & clinical sky-blue lighting
 * - Subtle precision clinical bio-grid lines (7% opacity)
 * - Floating refractive crystal sea-glass capsules
 * - Mouse parallax (desktop only, disabled on mobile & reduced motion)
 */
export const SpatialLoginBackground: React.FC<SpatialLoginBackgroundProps> = ({
  mouseParallax = { x: 0, y: 0 },
  variant = "light-sea",
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const parallaxX = shouldReduceMotion ? 0 : mouseParallax.x;
  const parallaxY = shouldReduceMotion ? 0 : mouseParallax.y;

  const isLight = variant === "light-sea";

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none transition-colors duration-500 ${
        isLight ? "bg-[#ebf5fb]" : "bg-[#050b18]"
      }`}
    >
      {/* 1. BASE CLINICAL GRADIENT (Light Sea Blue vs Deep Obsidian) */}
      <div
        className={`absolute inset-0 ${
          isLight
            ? "bg-radial from-[#e0f2fe] via-[#eaf5fc] to-[#d6ecfa] opacity-100"
            : "bg-radial from-[#0c1e3d] via-[#060e1f] to-[#040812] opacity-95"
        }`}
      />

      {/* 2. AMBIENT RADIAL LIGHT SOURCES (OCEAN CYAN & SKY BLUE) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: isLight ? 0.75 : 0.6, scale: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        className={`absolute -top-[20%] left-1/2 -translate-x-1/2 w-[750px] h-[580px] rounded-full blur-[140px] ${
          isLight
            ? "bg-gradient-to-b from-sky-400/35 via-cyan-400/25 to-transparent"
            : "bg-gradient-to-b from-cyan-500/25 via-blue-600/20 to-transparent"
        }`}
        style={{
          transform: `translate3d(calc(-50% + ${parallaxX * 8}px), ${parallaxY * 8}px, 0)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLight ? 0.5 : 0.4 }}
        transition={{ duration: 1.8, delay: 0.3 }}
        className={`absolute -bottom-[15%] -left-[10%] w-[520px] h-[520px] rounded-full blur-[130px] ${
          isLight ? "bg-blue-300/30" : "bg-blue-700/20"
        }`}
        style={{
          transform: `translate3d(${parallaxX * -6}px, ${parallaxY * -6}px, 0)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLight ? 0.45 : 0.35 }}
        transition={{ duration: 1.8, delay: 0.5 }}
        className={`absolute top-[35%] -right-[10%] w-[480px] h-[480px] rounded-full blur-[130px] ${
          isLight ? "bg-teal-200/40" : "bg-cyan-600/15"
        }`}
        style={{
          transform: `translate3d(${parallaxX * 5}px, ${parallaxY * -5}px, 0)`,
        }}
      />

      {/* 3. PRECISION CLINICAL BIO-GRID LINES (Subtle sea grid) */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: isLight
            ? `
                linear-gradient(to right, rgba(2, 132, 199, 0.45) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(2, 132, 199, 0.45) 1px, transparent 1px)
              `
            : `
                linear-gradient(to right, rgba(255, 255, 255, 0.4) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 1px, transparent 1px)
              `,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 100%)",
        }}
      />

      {/* 4. MIDGROUND: FLOATING REFRACTIVE SEA GLASS CAPSULES */}
      {isMounted && (
        <>
          {/* Top-right floating glass capsule */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isLight ? 0.7 : 0.45, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
            className={`absolute top-[12%] right-[14%] w-32 h-14 rounded-full backdrop-blur-[3px] hidden md:block ${
              isLight
                ? "border border-sky-300/50 bg-gradient-to-br from-white/70 to-sky-200/30 shadow-[0_8px_32px_rgba(2,132,199,0.12)]"
                : "border border-cyan-400/20 bg-gradient-to-br from-white/5 to-cyan-500/5 shadow-[0_8px_32px_rgba(0,163,255,0.08)]"
            }`}
            style={{
              transform: `rotate(-15deg) translate3d(${parallaxX * 12}px, ${parallaxY * 12}px, 0)`,
            }}
          >
            <div
              className={`absolute top-2 left-4 w-6 h-1 rounded-full ${
                isLight ? "bg-sky-400/60" : "bg-cyan-300/40"
              }`}
            />
          </motion.div>

          {/* Bottom-left floating glass sphere */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: isLight ? 0.6 : 0.35, y: 0 }}
            transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
            className={`absolute bottom-[18%] left-[12%] w-24 h-24 rounded-full backdrop-blur-[4px] hidden md:block ${
              isLight
                ? "border border-blue-300/50 bg-gradient-to-tr from-sky-300/20 to-white/70 shadow-[0_8px_32px_rgba(2,132,199,0.14)]"
                : "border border-blue-400/20 bg-gradient-to-tr from-blue-500/5 to-white/5 shadow-[0_8px_32px_rgba(0,82,204,0.12)]"
            }`}
            style={{
              transform: `translate3d(${parallaxX * -10}px, ${parallaxY * -10}px, 0)`,
            }}
          >
            <div
              className={`absolute bottom-3 right-3 w-3 h-3 rounded-full ${
                isLight ? "bg-sky-400/50 blur-xs" : "bg-cyan-400/25 blur-xs"
              }`}
            />
          </motion.div>
        </>
      )}

      {/* 5. SPECULAR TOP EDGE REFLECTION */}
      <div
        className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent ${
          isLight ? "via-sky-400/50" : "via-cyan-400/30"
        } to-transparent`}
      />
    </div>
  );
};

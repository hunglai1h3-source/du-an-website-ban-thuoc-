"use client";

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface SpatialLoginBackgroundProps {
  mouseParallax?: { x: number; y: number };
}

/**
 * H4CARE Spatial Atmospheric Background
 * Translates the high-end Settigation dark/atmospheric visual language into a clean,
 * deeply trusted clinical healthcare aesthetic:
 * - Deep Obsidian Navy & Slate base (#050b17)
 * - Multi-layer radial cyan/medical blue lighting
 * - Subtle precision medical bio-grid lines
 * - Smooth floating refractive glass rings
 * - Mouse parallax (desktop only, disabled on mobile & reduced motion)
 */
export const SpatialLoginBackground: React.FC<SpatialLoginBackgroundProps> = ({
  mouseParallax = { x: 0, y: 0 },
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const parallaxX = shouldReduceMotion ? 0 : mouseParallax.x;
  const parallaxY = shouldReduceMotion ? 0 : mouseParallax.y;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none bg-[#050b18]">
      {/* 1. BASE DEEP CLINICAL OBSIDIAN GRADIENT */}
      <div className="absolute inset-0 bg-radial from-[#0c1e3d] via-[#060e1f] to-[#040812] opacity-95" />

      {/* 2. AMBIENT RADIAL LIGHT SOURCES (CYAN & MEDICAL BLUE) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.6, scale: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[550px] rounded-full blur-[140px] bg-gradient-to-b from-cyan-500/25 via-blue-600/20 to-transparent"
        style={{
          transform: `translate3d(calc(-50% + ${parallaxX * 8}px), ${parallaxY * 8}px, 0)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1.8, delay: 0.3 }}
        className="absolute -bottom-[15%] -left-[10%] w-[500px] h-[500px] rounded-full blur-[120px] bg-blue-700/20"
        style={{
          transform: `translate3d(${parallaxX * -6}px, ${parallaxY * -6}px, 0)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ duration: 1.8, delay: 0.5 }}
        className="absolute top-[40%] -right-[10%] w-[450px] h-[450px] rounded-full blur-[130px] bg-cyan-600/15"
        style={{
          transform: `translate3d(${parallaxX * 5}px, ${parallaxY * -5}px, 0)`,
        }}
      />

      {/* 3. PRECISION CLINICAL BIO-GRID LINES (Subtle 3-4% opacity) */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 65% 65% at 50% 50%, black 25%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 65% 65% at 50% 50%, black 25%, transparent 100%)",
        }}
      />

      {/* 4. MIDGROUND: FLOATING REFRACTIVE MEDICAL RINGS / CAPSULES */}
      {isMounted && (
        <>
          {/* Top-right floating glass capsule */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 0.45, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
            className="absolute top-[12%] right-[14%] w-32 h-14 rounded-full border border-cyan-400/20 bg-gradient-to-br from-white/5 to-cyan-500/5 backdrop-blur-[2px] shadow-[0_8px_32px_rgba(0,163,255,0.08)] hidden md:block"
            style={{
              transform: `rotate(-15deg) translate3d(${parallaxX * 12}px, ${parallaxY * 12}px, 0)`,
            }}
          >
            <div className="absolute top-2 left-4 w-6 h-1 rounded-full bg-cyan-300/40" />
          </motion.div>

          {/* Bottom-left floating glass sphere */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 0.35, y: 0 }}
            transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
            className="absolute bottom-[18%] left-[12%] w-24 h-24 rounded-full border border-blue-400/20 bg-gradient-to-tr from-blue-500/5 to-white/5 backdrop-blur-[3px] shadow-[0_8px_32px_rgba(0,82,204,0.12)] hidden md:block"
            style={{
              transform: `translate3d(${parallaxX * -10}px, ${parallaxY * -10}px, 0)`,
            }}
          >
            <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-cyan-400/25 blur-xs" />
          </motion.div>
        </>
      )}

      {/* 5. SPECULAR TOP EDGE REFLECTION */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
    </div>
  );
};

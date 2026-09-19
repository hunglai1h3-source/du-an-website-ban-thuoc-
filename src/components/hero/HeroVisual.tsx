"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ShieldCheck,
  Star,
  CheckCircle2,
  Stethoscope,
  Sparkles,
  ThermometerSnowflake,
  Clock,
  Pill,
} from "lucide-react";
import { AbstractSymbol } from "../branding/AbstractSymbol";

export const HeroVisual: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchOrReduced, setIsTouchOrReduced] = useState(false);

  useEffect(() => {
    const checkCapabilities = () => {
      const isTouch =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth < 1024;
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      setIsTouchOrReduced(isTouch || prefersReduced);
    };
    checkCapabilities();
    window.addEventListener("resize", checkCapabilities);
    return () => window.removeEventListener("resize", checkCapabilities);
  }, []);

  // Smooth mouse tilt physics for desktop
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["6deg", "-6deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-6deg", "6deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchOrReduced || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[460px] sm:max-w-[500px] lg:max-w-[520px] aspect-square flex items-center justify-center select-none perspective-[1200px]"
    >
      {/* Background Layer 1: Ambient Studio Glow Atmosphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-gradient-to-tr from-brand-blue-400/20 via-brand-cyan-300/25 to-brand-emerald-300/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -top-6 -right-6 w-48 h-48 bg-cyan-200/25 rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-blue-300/20 rounded-full blur-[60px] pointer-events-none" />

      {/* Main 3D Art-Directed Stage */}
      <motion.div
        style={{
          rotateX: isTouchOrReduced ? 0 : rotateX,
          rotateY: isTouchOrReduced ? 0 : rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative w-full h-full rounded-[32px] p-5 sm:p-7 bg-gradient-to-b from-white/95 via-white/85 to-[#eef6ff]/80 backdrop-blur-2xl border border-white/90 shadow-depth-3 transition-shadow duration-300 hover:shadow-depth-4 flex flex-col justify-between overflow-hidden"
      >
        {/* Subtle Decorative Ambient Lighting Sheen inside Card */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-white/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-100/40 rounded-full blur-2xl pointer-events-none" />

        {/* Top Product Header Row */}
        <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-100/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-blue-600 to-brand-cyan-500 flex items-center justify-center shadow-sm">
              <AbstractSymbol size={18} />
            </div>
            <div>
              <span className="text-[11px] font-black text-slate-900 tracking-wider block leading-none">
                H4CARE PHARMA LAB
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Digital Healthcare Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-50/90 border border-emerald-200/70 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-700">
              Tiêu chuẩn GPP / GSP
            </span>
          </div>
        </div>

        {/* Central Visual Showcase: Luxury Tactile Pharmaceutical Composition */}
        <div className="relative z-10 my-auto py-2 flex items-center justify-center">
          {/* Circular Grounding Studio Podium */}
          <div className="absolute w-72 sm:w-80 h-36 bg-gradient-to-b from-slate-200/50 via-slate-100/30 to-transparent rounded-[100%] blur-sm -bottom-4 pointer-events-none" />

          {/* Composition Container */}
          <div className="relative flex items-center justify-center gap-4 sm:gap-6">
            {/* Primary Physical Product: Modern Cobalt Glass Apothecary Bottle */}
            <motion.div
              animate={isTouchOrReduced ? {} : { y: [0, -4, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-36 sm:w-44 h-52 sm:h-60 rounded-[28px] bg-gradient-to-b from-[#0f2744] via-[#091e36] to-[#040d18] p-3.5 sm:p-4 shadow-2xl border border-white/20 flex flex-col justify-between text-white overflow-hidden group"
              style={{ transform: "translateZ(35px)" }}
            >
              {/* Bottle Glass Specular Reflection Highlight */}
              <div className="absolute top-0 left-3 w-1.5 h-full bg-gradient-to-b from-white/40 via-white/10 to-transparent rounded-full opacity-70" />
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-brand-cyan-400/20 rounded-full blur-xl" />

              {/* Bottle Neck / Cap Aesthetic */}
              <div className="w-12 h-3 mx-auto -mt-1 rounded-t-md bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 opacity-90 shadow-sm border-b border-slate-600" />

              {/* Bottle Center Prescription Label */}
              <div className="my-auto bg-white/95 backdrop-blur-md rounded-xl p-2.5 sm:p-3 text-slate-900 shadow-lg border border-white">
                <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-100">
                  <span className="text-[9px] font-black tracking-wider text-brand-blue-700">
                    H4CARE CLINICAL
                  </span>
                  <Pill className="w-3 h-3 text-brand-cyan-600" />
                </div>
                <p className="text-xs sm:text-[13px] font-extrabold text-slate-900 leading-tight">
                  Active Formula No.04
                </p>
                <p className="text-[9px] text-slate-500 font-medium mt-0.5">
                  Phức hợp Dược khoa • 60 Viên
                </p>
                <div className="mt-2 pt-1 border-t border-dashed border-slate-200 flex items-center justify-between text-[8px] font-mono text-slate-400">
                  <span>LOT: 2026-H4</span>
                  <span className="text-emerald-600 font-bold">CHUẨN GPP</span>
                </div>
              </div>

              {/* Bottle Bottom Security Tag */}
              <div className="flex items-center justify-between text-[9px] text-slate-400 px-1 font-mono">
                <span>SEALED 100%</span>
                <span className="text-brand-cyan-400 font-bold">25°C GSP</span>
              </div>
            </motion.div>

            {/* Secondary Product: Sleek Minimalist Clinical Blister & Vial Card */}
            <motion.div
              animate={isTouchOrReduced ? {} : { y: [0, 4, 0] }}
              transition={{
                duration: 5.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
              className="relative w-28 sm:w-36 h-40 sm:h-48 rounded-2xl bg-white/95 backdrop-blur-xl p-3 shadow-xl border border-white/90 flex flex-col justify-between"
              style={{ transform: "translateZ(45px)" }}
            >
              {/* Blister Card Header */}
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 rounded-lg bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">
                  Liều Dùng
                </span>
              </div>

              {/* Realistic Blister Pocket Grid */}
              <div className="grid grid-cols-2 gap-2 my-1">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-7 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50/60 border border-brand-blue-100 flex items-center justify-center shadow-inner relative overflow-hidden"
                  >
                    <div className="w-5 h-2 rounded-full bg-gradient-to-r from-brand-blue-500 to-brand-cyan-400 shadow-sm" />
                    <div className="absolute top-0.5 left-1.5 w-1 h-1 rounded-full bg-white/80" />
                  </div>
                ))}
              </div>

              {/* Blister Verification Status */}
              <div className="bg-slate-50 rounded-lg p-1.5 text-center border border-slate-100">
                <span className="text-[9px] font-bold text-slate-700 block leading-tight">
                  Toa Bác Sĩ
                </span>
                <span className="text-[8px] text-emerald-600 font-semibold">
                  Đã thẩm định
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Floating Badge 1: Pharmacist Consultation (Top-Right) */}
        <motion.div
          animate={isTouchOrReduced ? {} : { y: [0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ transform: "translateZ(55px)" }}
          className="absolute -top-1 -right-1 sm:-right-3 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-depth-2 border border-slate-200/90 flex items-center gap-2.5 z-20"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center shrink-0 border border-brand-blue-100">
              <Stethoscope className="w-4 h-4" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-800 leading-tight">
              Dược Sĩ Đại Học
            </p>
            <p className="text-[10px] text-brand-blue-600 font-medium">
              Tư vấn toa thuốc 1-1
            </p>
          </div>
        </motion.div>

        {/* Floating Badge 2: Certified Cold Storage & Speed (Bottom-Left) */}
        <motion.div
          animate={isTouchOrReduced ? {} : { y: [0, 5, 0] }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.8,
          }}
          style={{ transform: "translateZ(65px)" }}
          className="absolute -bottom-2 -left-1 sm:-left-3 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-depth-2 border border-slate-200/90 flex items-center gap-2.5 z-20"
        >
          <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 border border-cyan-100">
            <ThermometerSnowflake className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-800 leading-tight">
              Bảo Quản GSP Chuẩn
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              Giao hỏa tốc 2 giờ
            </p>
          </div>
        </motion.div>

        {/* Bottom Social Proof & Purity Assurance */}
        <div className="relative z-10 pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-current" />
              ))}
            </div>
            <span className="font-bold text-slate-800 text-[11px]">4.9/5</span>
            <span className="text-slate-400 text-[10px]">
              (Đánh giá trải nghiệm)
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-semibold text-brand-blue-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Nguồn gốc rõ ràng</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

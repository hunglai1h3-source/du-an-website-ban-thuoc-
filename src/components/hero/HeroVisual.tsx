"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ShieldCheck,
  Star,
  CheckCircle2,
  Stethoscope,
  Sparkles,
  Thermometer,
  Zap,
} from "lucide-react";
import { AbstractSymbol } from "../branding/AbstractSymbol";

export const HeroVisual: React.FC = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchOrReduced, setIsTouchOrReduced] = useState(false);

  useEffect(() => {
    const checkCapabilities = () => {
      const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024;
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setIsTouchOrReduced(isTouch || prefersReduced);
    };
    checkCapabilities();
    window.addEventListener("resize", checkCapabilities);
    return () => window.removeEventListener("resize", checkCapabilities);
  }, []);

  // Smooth mouse tilt physics for desktop
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 160, damping: 22 });
  const mouseYSpring = useSpring(y, { stiffness: 160, damping: 22 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchOrReduced || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
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
    <div className="relative w-full max-w-lg lg:max-w-xl mx-auto flex items-center justify-center select-none perspective-[1200px]">
      {/* Background Layer 1: Ambient Medical Glow Blobs */}
      <div className="absolute -top-8 -right-8 w-64 h-64 bg-cyan-200/30 rounded-full blur-[70px] pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-blue-200/30 rounded-full blur-[70px] pointer-events-none" />

      {/* Midground Layer 2: Main 3D Interactive Card (Looks pristine even static) */}
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: isTouchOrReduced ? 0 : rotateX,
          rotateY: isTouchOrReduced ? 0 : rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative w-full rounded-3xl p-6 md:p-8 bg-gradient-to-b from-white/95 via-white/90 to-blue-50/70 backdrop-blur-2xl border border-white shadow-depth-3 transition-shadow duration-300 hover:shadow-depth-4"
      >
        {/* Top Header inside card */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-blue-600 to-brand-cyan-500 flex items-center justify-center text-white shadow-sm">
              <AbstractSymbol size={22} />
            </div>
            <div>
              <span className="text-xs font-black text-slate-800 tracking-wider">H4CARE PHARMACY</span>
              <span className="text-[10px] text-emerald-600 font-semibold block flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Hệ Thống Đơn Thuốc Số Hóa
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-brand-blue-50 px-2.5 py-1 rounded-full border border-brand-blue-100">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-blue-600" />
            <span className="text-[10px] font-bold text-brand-blue-700">Chuẩn GPP Bộ Y Tế</span>
          </div>
        </div>

        {/* Central Visual Stage: Stylized 3D Capsule & Medical Grid */}
        <div className="relative my-6 py-6 flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-tr from-slate-900 via-brand-blue-950 to-slate-950 p-6 shadow-inner text-white">
          {/* Subtle precision grid pattern */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />

          {/* Central 3D Capsule Graphic */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative w-44 h-20 rounded-full bg-gradient-to-r from-brand-blue-500 via-brand-cyan-400 to-emerald-400 p-1 shadow-2xl flex items-center justify-between overflow-hidden group">
              {/* Left half */}
              <div className="w-1/2 h-full bg-gradient-to-r from-brand-blue-700 to-brand-blue-500 flex items-center justify-center border-r border-white/20">
                <span className="text-[11px] font-black tracking-widest text-white/95">H4</span>
              </div>
              {/* Right half */}
              <div className="w-1/2 h-full bg-gradient-to-r from-brand-cyan-400 to-emerald-400 flex items-center justify-center">
                <span className="text-[11px] font-black tracking-widest text-slate-900">CARE</span>
              </div>
              {/* Shimmer light sweep */}
              {!isTouchOrReduced && (
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
                  className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12"
                />
              )}
            </div>

            <div className="mt-4 flex items-center gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                Bảo quản GSP: 21°C
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                Độ ẩm 58% (Tối ưu)
              </span>
            </div>
          </div>
        </div>

        {/* Foreground Layer 3: Floating Interactive Badges */}
        {/* Floating Badge 1: Verified Prescription */}
        <motion.div
          animate={isTouchOrReduced ? {} : { y: [0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ transform: "translateZ(30px)" }}
          className="absolute -top-3 -right-2 md:-right-5 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-depth-2 border border-slate-200/90 flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-800 leading-tight">Đơn Thuốc Điện Tử</p>
            <p className="text-[10px] text-emerald-600 font-semibold">Đã xác thực chuyên môn</p>
          </div>
        </motion.div>

        {/* Floating Badge 2: Pharmacist Live Support */}
        <motion.div
          animate={isTouchOrReduced ? {} : { y: [0, 5, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          style={{ transform: "translateZ(40px)" }}
          className="absolute -bottom-4 -left-2 md:-left-5 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-depth-2 border border-slate-200/90 flex items-center gap-2.5"
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center shrink-0 border border-brand-blue-100">
              <Stethoscope className="w-4 h-4" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-800 leading-tight">Dược Sĩ Trực Tuyến</p>
            <p className="text-[10px] text-brand-blue-600 font-semibold">Tư vấn đúng liều, đúng bệnh</p>
          </div>
        </motion.div>

        {/* Bottom Social Proof Bar */}
        <div className="pt-4 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <span className="font-bold text-slate-800">4.9/5</span>
            <span className="text-slate-400 text-[11px]">(25.000+ người tin chọn)</span>
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-blue-600">
            <Sparkles className="w-3 h-3" />
            Giao nhanh 2h
          </span>
        </div>
      </motion.div>
    </div>
  );
};

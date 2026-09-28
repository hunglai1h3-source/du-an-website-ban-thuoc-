"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AbstractSymbol } from "../branding/AbstractSymbol";
import { FptPolyBadge } from "../branding/FptPolyBadge";
import { Sparkles, FastForward } from "lucide-react";

interface IntroAnimationProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({
  onComplete,
  forceShow = false,
}) => {
  const [currentScene, setCurrentScene] = useState<number>(1);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  const finishIntro = useCallback(() => {
    setIsVisible(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("h4care_intro_seen", "true");
    }
    if (onComplete) onComplete();
  }, [onComplete]);

  // Check sessionStorage & reduced motion
  useEffect(() => {
    if (typeof window !== "undefined") {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const hasSeenIntro = sessionStorage.getItem("h4care_intro_seen");

      if ((hasSeenIntro && !forceShow) || prefersReduced) {
        setIsVisible(false);
        if (onComplete) onComplete();
        return;
      }

      // Keyboard Esc to skip
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          finishIntro();
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      // Orchestrate sequence with unified Motion Language timing
      const sceneTimers: NodeJS.Timeout[] = [];

      // Scene 1: FPT Poly Student Project (0s - 1.3s)
      sceneTimers.push(setTimeout(() => setCurrentScene(2), 1300));

      // Scene 2: 4 shapes convergence (1.3s - 2.6s)
      sceneTimers.push(setTimeout(() => setCurrentScene(3), 2600));

      // Scene 3: H4CARE Wordmark reveal (2.6s - 3.6s)
      sceneTimers.push(setTimeout(() => setCurrentScene(4), 3600));

      // Scene 4: Tagline reveal (3.6s - 4.7s)
      sceneTimers.push(setTimeout(() => setCurrentScene(5), 4700));

      // Scene 5: Clean curtain reveal into Hero (4.7s - 5.3s)
      sceneTimers.push(setTimeout(() => finishIntro(), 5300));

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        sceneTimers.forEach(clearTimeout);
      };
    }
  }, [forceShow, finishIntro, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="intro-overlay"
        initial={{ opacity: 1 }}
        exit={{
          opacity: 0,
          scale: 1.02,
          filter: "blur(8px)",
          transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
        }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-white via-slate-50 to-[#f0f7ff] overflow-hidden select-none"
      >
        {/* Subtle background ambient mesh */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-200/40 blur-[100px] animate-pulse-slow" />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-cyan-200/40 blur-[100px] animate-pulse-slow"
            style={{ animationDelay: "1.5s" }}
          />
        </div>

        {/* Skip button top-right */}
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={finishIntro}
          className="absolute top-6 right-6 z-50 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-500 hover:text-brand-blue-700 bg-white/80 hover:bg-white border border-slate-200/90 shadow-depth-1 backdrop-blur-md transition-all duration-150 group active:scale-95"
          title="Bỏ qua phần giới thiệu (Phím Esc)"
        >
          <span>Bỏ qua</span>
          <FastForward className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-blue-600 transition-colors" />
        </motion.button>

        {/* ================= SCENE 1: FPT POLYTECHNIC STUDENT PROJECT ================= */}
        {currentScene === 1 && (
          <motion.div
            key="scene-1"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 1.02 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center px-4"
          >
            <div className="mb-4">
              <FptPolyBadge variant="light" className="px-5 py-2.5 shadow-depth-1" />
            </div>
            <p className="text-xs font-semibold text-slate-400 tracking-widest uppercase mt-2">
              Khoa Công Nghệ Thông Tin • Dược Phẩm Số 2026
            </p>
          </motion.div>
        )}

        {/* ================= SCENE 2: 4 ENERGY SHAPES MERGE ================= */}
        {currentScene === 2 && (
          <motion.div
            key="scene-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="relative flex flex-col items-center justify-center w-64 h-64"
          >
            {/* 4 converging nodes representing: Hùng, Đức Anh, Hoàn, Cường */}
            {/* Top-Left: Hùng */}
            <motion.div
              initial={{ x: -80, y: -80, opacity: 0, scale: 0.6 }}
              animate={{ x: -16, y: -16, opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-blue-700 to-brand-blue-500 shadow-depth-2 flex items-center justify-center text-[10px] font-bold text-white tracking-wider"
            >
              H
            </motion.div>

            {/* Top-Right: Đức Anh */}
            <motion.div
              initial={{ x: 80, y: -80, opacity: 0, scale: 0.6 }}
              animate={{ x: 16, y: -16, opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute w-12 h-12 rounded-2xl bg-gradient-to-bl from-brand-cyan-400 to-brand-blue-500 shadow-depth-2 flex items-center justify-center text-[10px] font-bold text-white tracking-wider"
            >
              ĐA
            </motion.div>

            {/* Bottom-Left: Hoàn */}
            <motion.div
              initial={{ x: -80, y: 80, opacity: 0, scale: 0.6 }}
              animate={{ x: -16, y: 16, opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-blue-900 to-brand-blue-600 shadow-depth-2 flex items-center justify-center text-[10px] font-bold text-white tracking-wider"
            >
              H
            </motion.div>

            {/* Bottom-Right: Cường */}
            <motion.div
              initial={{ x: 80, y: 80, opacity: 0, scale: 0.6 }}
              animate={{ x: 16, y: 16, opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute w-12 h-12 rounded-2xl bg-gradient-to-tl from-brand-emerald-500 to-brand-cyan-500 shadow-depth-2 flex items-center justify-center text-[10px] font-bold text-white tracking-wider"
            >
              C
            </motion.div>

            {/* Center fusion pulse ring */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0.8, 1.8, 2.2], opacity: [0, 0.7, 0] }}
              transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
              className="absolute w-20 h-20 rounded-full border-2 border-brand-cyan-400"
            />

            <motion.p
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 52 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="text-[11px] font-semibold text-brand-blue-600 tracking-wider uppercase mt-4"
            >
              4 Thành viên Hội tụ • Hùng • Đức Anh • Hoàn • Cường
            </motion.p>
          </motion.div>
        )}

        {/* ================= SCENE 3 & 4: H4CARE WORDMARK & TAGLINE REVEAL ================= */}
        {(currentScene === 3 || currentScene === 4 || currentScene === 5) && (
          <motion.div
            key="scene-3-4"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center px-4 text-center max-w-xl"
          >
            {/* Unified Symbol with pulse */}
            <motion.div
              initial={{ scale: 0.75, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="mb-6 relative"
            >
              <AbstractSymbol size={76} withGlow={true} />
            </motion.div>

            {/* Scene 3: Wordmark H4CARE */}
            <motion.div
              initial={{ opacity: 0, filter: "blur(10px)", letterSpacing: "0.15em" }}
              animate={{ opacity: 1, filter: "blur(0px)", letterSpacing: "0.02em" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center"
            >
              <span className="text-4xl md:text-5xl font-black text-brand-blue-700 tracking-wider">
                H
              </span>
              <span className="text-4xl md:text-5xl font-black text-brand-cyan-500 tracking-wider">
                4
              </span>
              <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                CARE
              </span>
              <span className="text-2xl md:text-3xl font-extrabold text-brand-emerald-500 ml-1">
                +
              </span>
            </motion.div>

            {/* Scene 4: Tagline Clip-Path Reveal */}
            {currentScene >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 12, clipPath: "inset(100% 0% 0% 0%)" }}
                animate={{ opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)" }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="mt-4"
              >
                <p className="text-base md:text-lg font-medium text-slate-600 italic">
                  &ldquo;Chăm sóc sức khỏe, bắt đầu từ sự thấu hiểu.&rdquo;
                </p>
                <div className="flex items-center justify-center gap-1.5 mt-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500" />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan-500" />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald-500" />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-400" />
                </div>
              </motion.div>
            )}

            {/* Scene 5: Launching indicator */}
            {currentScene === 5 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex items-center gap-2 text-xs font-semibold text-brand-cyan-700 bg-cyan-50/90 px-3.5 py-1 rounded-full border border-cyan-200/80 shadow-depth-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-cyan-600 animate-spin" />
                <span>Chào mừng đến với H4CARE Pharmacy...</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

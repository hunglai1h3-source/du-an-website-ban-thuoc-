"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Loader2, Sparkles, ArrowRight } from "lucide-react";

export interface LiquidMetalButtonProps {
  type?: "button" | "submit";
  onClick?: () => void;
  isLoading?: boolean;
  isSuccess?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * H4CARE Liquid Metal Capsule Button
 * Inspired by Settigation's browser liquid metal sign-in button:
 * - Fluid SVG gooey filter neck stretching & snapping with spring damping physics
 * - Dual capsule pole separation with droplet retraction
 * - Prismatic liquid chrome & clinical blue/cyan specular sheen
 * - 60 FPS requestAnimationFrame physics loop
 */
export const LiquidMetalButton: React.FC<LiquidMetalButtonProps> = ({
  type = "submit",
  onClick,
  isLoading = false,
  isSuccess = false,
  disabled = false,
  children = "Đăng nhập H4CARE",
  className = "",
}) => {
  const containerRef = useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Physics simulation state
  const [pull, setPull] = useState(0);
  const [wobbleY, setWobbleY] = useState(0);
  const [isSnapped, setIsSnapped] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  // Spring physics variables
  const physicsRef = useRef({
    currentPull: 0,
    targetPull: 0,
    velocityPull: 0,
    currentWobbleY: 0,
    velocityWobbleY: 0,
    // Settigation parameters:
    PULL_LIMIT: 34,
    TENSION: 0.16,
    DAMPING: 0.74,
  });

  const animFrameRef = useRef<number | null>(null);

  // Run physics tick
  const updatePhysics = useCallback(() => {
    if (shouldReduceMotion) return;

    const p = physicsRef.current;

    // Pull spring equation
    const forcePull = (p.targetPull - p.currentPull) * p.TENSION;
    p.velocityPull = (p.velocityPull + forcePull) * p.DAMPING;
    p.currentPull += p.velocityPull;

    // Vertical wobble spring equation
    const forceWobble = (0 - p.currentWobbleY) * (p.TENSION * 1.2);
    p.velocityWobbleY = (p.velocityWobbleY + forceWobble) * (p.DAMPING * 0.9);
    p.currentWobbleY += p.velocityWobbleY;

    // Check snap condition: if pulled beyond threshold, break neck temporarily
    const snapped = Math.abs(p.currentPull) > 28;
    setIsSnapped(snapped);
    setPull(p.currentPull);
    setWobbleY(p.currentWobbleY);

    // Continue loop if still oscillating
    const isMoving =
      Math.abs(p.velocityPull) > 0.05 ||
      Math.abs(p.targetPull - p.currentPull) > 0.05 ||
      Math.abs(p.velocityWobbleY) > 0.05;

    if (isMoving) {
      animFrameRef.current = requestAnimationFrame(updatePhysics);
    } else {
      animFrameRef.current = null;
    }
  }, [shouldReduceMotion]);

  const kickPhysics = useCallback(
    (targetPull: number, wobbleYKick: number = 0) => {
      if (shouldReduceMotion) return;
      physicsRef.current.targetPull = targetPull;
      if (wobbleYKick) {
        physicsRef.current.velocityWobbleY += wobbleYKick;
      }
      if (!animFrameRef.current) {
        animFrameRef.current = requestAnimationFrame(updatePhysics);
      }
    },
    [shouldReduceMotion, updatePhysics]
  );

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Handle pointer interactions
  const handleMouseEnter = () => {
    if (disabled || isLoading || isSuccess) return;
    kickPhysics(8, 2);
  };

  const handleMouseLeave = () => {
    if (disabled || isLoading || isSuccess) return;
    setIsPressed(false);
    kickPhysics(0, -1);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || isLoading || isSuccess) return;
    setIsPressed(true);
    kickPhysics(28, 4);
  };

  const handleMouseUp = () => {
    if (disabled || isLoading || isSuccess) return;
    setIsPressed(false);
    kickPhysics(0, -6);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const handleClick = (e: React.MouseEvent) => {
    if (disabled || isLoading || isSuccess) {
      e.preventDefault();
      return;
    }
    // Snap and rebound sequence
    kickPhysics(32, 5);
    setTimeout(() => {
      kickPhysics(0, -8);
    }, 120);

    if (onClick) onClick();
  };

  // Dimensions for SVG fluid simulation
  const width = 360;
  const height = 54;
  const radius = 24;
  const centerX = width / 2;
  const centerY = height / 2;

  // Pole offsets driven by spring physics
  const leftPoleX = centerX - 60 - pull;
  const rightPoleX = centerX + 60 + pull;
  const neckThickness = Math.max(8, 28 - Math.abs(pull) * 0.7);

  return (
    <div className="relative w-full max-w-sm mx-auto select-none group">
      {/* Ambient background glow reflection */}
      <div
        className={`absolute -inset-1.5 rounded-full transition-all duration-300 blur-lg pointer-events-none ${
          isSuccess
            ? "bg-emerald-500/40 opacity-90 scale-105"
            : isLoading
            ? "bg-cyan-500/30 opacity-70 animate-pulse"
            : isPressed
            ? "bg-cyan-400/35 opacity-80"
            : "bg-gradient-to-r from-blue-600/30 via-cyan-500/20 to-blue-700/30 opacity-60 group-hover:opacity-100 group-hover:scale-105"
        }`}
      />

      <button
        ref={containerRef}
        type={type}
        disabled={disabled || isLoading || isSuccess}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`relative w-full h-[54px] rounded-full overflow-hidden flex items-center justify-center font-bold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 shadow-depth-3 active:scale-[0.985] ${className}`}
        style={{
          transform: shouldReduceMotion
            ? undefined
            : `translateY(${wobbleY * 0.4}px)`,
        }}
      >
        {/* ================= SVG LIQUID METAL / MERCURY LAYER ================= */}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            filter: shouldReduceMotion ? undefined : "url(#h4care-goo-filter)",
          }}
        >
          <defs>
            {/* The SVG Gooey Filter: Blurs elements and compresses alpha channel for liquid meniscus */}
            <filter id="h4care-goo-filter" colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8"
                result="goo"
              />
              <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>

            {/* Premium Liquid Mercury & Clinical Blue Gradient */}
            <linearGradient id="liquidMercury" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0c4a6e" />
              <stop offset="20%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#0052cc" />
              <stop offset="80%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            {/* Success Emerald Flow Gradient */}
            <linearGradient id="liquidSuccess" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#065f46" />
              <stop offset="45%" stopColor="#059669" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Specular Chrome Highlight */}
            <linearGradient id="chromeHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="35%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Background Capsule Base Plate */}
          <rect
            x="2"
            y="2"
            width={width - 4}
            height={height - 4}
            rx={radius}
            fill={isSuccess ? "url(#liquidSuccess)" : "url(#liquidMercury)"}
          />

          {/* LEFT CAPSULE POLE (Separates on pull) */}
          <ellipse
            cx={leftPoleX}
            cy={centerY}
            rx={radius + 4}
            ry={radius - 2}
            fill={isSuccess ? "url(#liquidSuccess)" : "url(#liquidMercury)"}
          />

          {/* RIGHT CAPSULE POLE (Separates on pull) */}
          <ellipse
            cx={rightPoleX}
            cy={centerY}
            rx={radius + 4}
            ry={radius - 2}
            fill={isSuccess ? "url(#liquidSuccess)" : "url(#liquidMercury)"}
          />

          {/* DYNAMIC CONNECTING LIQUID NECK */}
          {!isSnapped && (
            <rect
              x={leftPoleX + 6}
              y={centerY - neckThickness / 2}
              width={Math.max(1, rightPoleX - leftPoleX - 12)}
              height={neckThickness}
              rx={neckThickness / 2}
              fill={isSuccess ? "url(#liquidSuccess)" : "url(#liquidMercury)"}
            />
          )}

          {/* LIQUID MERCURY DROPLETS (When neck snaps) */}
          {isSnapped && (
            <>
              <circle
                cx={centerX - 10}
                cy={centerY}
                r="6"
                fill={isSuccess ? "url(#liquidSuccess)" : "url(#liquidMercury)"}
              />
              <circle
                cx={centerX + 10}
                cy={centerY}
                r="6"
                fill={isSuccess ? "url(#liquidSuccess)" : "url(#liquidMercury)"}
              />
            </>
          )}

          {/* Specular Chrome Sheen Top Overlay */}
          <rect
            x="2"
            y="2"
            width={width - 4}
            height={height - 4}
            rx={radius}
            fill="url(#chromeHighlight)"
          />
        </svg>

        {/* Dynamic Specular Light Beam tracking mouse */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 transition-opacity duration-300 group-hover:opacity-75"
          style={{
            background: `radial-gradient(140px circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,0.45), transparent 70%)`,
          }}
        />

        {/* Border Glint Ring */}
        <div className="absolute inset-0 rounded-full border border-white/25 pointer-events-none" />
        <div className="absolute inset-[1px] rounded-full border border-cyan-300/20 pointer-events-none" />

        {/* ================= CONTENT & STATES ================= */}
        <div className="relative z-10 flex items-center justify-center gap-2.5 text-sm sm:text-base font-extrabold tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-cyan-100"
            >
              <Loader2 className="w-5 h-5 animate-spin text-cyan-300" />
              <span>Đang kết nối bảo mật...</span>
            </motion.div>
          ) : isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-emerald-100 font-black"
            >
              <div className="w-5 h-5 rounded-full bg-white text-emerald-600 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span>Xác thực thành công</span>
            </motion.div>
          ) : (
            <div className="flex items-center gap-2 transition-transform duration-200 group-hover:translate-x-0.5">
              <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
              <span>{children}</span>
              <ArrowRight className="w-4 h-4 text-cyan-200 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          )}
        </div>
      </button>

      {/* Subtle bottom shadow with medical blue tint */}
      <div className="w-3/4 mx-auto h-2 bg-cyan-500/20 rounded-full blur-md -mt-1 pointer-events-none" />
    </div>
  );
};

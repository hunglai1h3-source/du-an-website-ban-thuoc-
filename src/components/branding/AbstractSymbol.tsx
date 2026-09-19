"use client";

import React from "react";

interface AbstractSymbolProps {
  size?: number;
  className?: string;
  withGlow?: boolean;
}

export const AbstractSymbol: React.FC<AbstractSymbolProps> = ({
  size = 40,
  className = "",
  withGlow = false,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {withGlow && (
        <div
          className="absolute inset-0 rounded-2xl blur-lg opacity-35 bg-gradient-to-tr from-brand-blue-600 via-brand-cyan-500 to-brand-emerald-400 pointer-events-none"
          style={{ transform: "scale(1.2)" }}
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          {/* Continuous harmonic gradient ring representing 4 founders: Hùng, Đức Anh, Hoàn, Cường */}
          <linearGradient id="h4-petal-nw" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0052cc" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          <linearGradient id="h4-petal-ne" x1="84" y1="16" x2="52" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          <linearGradient id="h4-petal-se" x1="84" y1="84" x2="52" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          <linearGradient id="h4-petal-sw" x1="16" y1="84" x2="48" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0041a3" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Central core medical jewel */}
          <radialGradient id="h4-core-glow" cx="50" cy="50" r="14" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.4" />
          </radialGradient>
        </defs>

        {/* 1. North-West Element: Hùng (Leadership & Foundation) */}
        <path
          d="M 32 12 C 41 12 46 17 46 26 L 46 42 C 46 44.5 44.5 46 42 46 L 26 46 C 17 46 12 41 12 32 C 12 21 21 12 32 12 Z"
          fill="url(#h4-petal-nw)"
        />

        {/* 2. North-East Element: Đức Anh (Precision & Digital Health) */}
        <path
          d="M 68 12 C 79 12 88 21 88 32 C 88 41 83 46 74 46 L 58 46 C 55.5 46 54 44.5 54 42 L 54 26 C 54 17 59 12 68 12 Z"
          fill="url(#h4-petal-ne)"
        />

        {/* 3. South-East Element: Cường (Vitality & Care Growth) */}
        <path
          d="M 68 88 C 59 88 54 83 54 74 L 54 58 C 54 55.5 55.5 54 58 54 L 74 54 C 83 54 88 59 88 68 C 88 79 79 88 68 88 Z"
          fill="url(#h4-petal-se)"
        />

        {/* 4. South-West Element: Hoàn (Reliability & Human Care) */}
        <path
          d="M 32 88 C 21 88 12 79 12 68 C 12 59 17 54 26 54 L 42 54 C 44.5 54 46 55.5 46 58 L 46 74 C 46 83 41 88 32 88 Z"
          fill="url(#h4-petal-sw)"
        />

        {/* Central Core: Negative Space Medical Cross Center Jewel */}
        <circle cx="50" cy="50" r="9" fill="url(#h4-core-glow)" />
        <circle cx="50" cy="50" r="8" stroke="#0284c7" strokeWidth="0.75" strokeOpacity="0.3" fill="none" />
        <path
          d="M 50 45 L 50 55 M 45 50 L 55 50"
          stroke="#0052cc"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};


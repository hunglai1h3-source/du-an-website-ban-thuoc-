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
          d="M 33 13 C 44 13 48.5 21 48.5 33.5 C 48.5 42 42 48.5 33.5 48.5 C 21 48.5 13 44 13 33 C 13 21 21 13 33 13 Z"
          fill="url(#h4-petal-nw)"
        />

        {/* 2. North-East Element: Đức Anh (Precision & Digital Health) */}
        <path
          d="M 67 13 C 79 13 87 21 87 33 C 87 44 79 48.5 66.5 48.5 C 58 48.5 51.5 42 51.5 33.5 C 51.5 21 56 13 67 13 Z"
          fill="url(#h4-petal-ne)"
        />

        {/* 3. South-East Element: Cường (Vitality & Care Growth) */}
        <path
          d="M 66.5 51.5 C 79 51.5 87 56 87 67 C 87 79 79 87 67 87 C 56 87 51.5 79 51.5 66.5 C 51.5 58 58 51.5 66.5 51.5 Z"
          fill="url(#h4-petal-se)"
        />

        {/* 4. South-West Element: Hoàn (Reliability & Human Care) */}
        <path
          d="M 33.5 51.5 C 42 51.5 48.5 58 48.5 66.5 C 48.5 79 44 87 33 87 C 21 87 13 79 13 67 C 13 56 21 51.5 33.5 51.5 Z"
          fill="url(#h4-petal-sw)"
        />

        {/* Negative Space Medical Cross Enhancement: Inner aperture ring */}
        <circle cx="50" cy="50" r="8" fill="url(#h4-core-glow)" />
        <path
          d="M 50 44 L 50 56 M 44 50 L 56 50"
          stroke="#0052cc"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};


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
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {withGlow && (
        <div
          className="absolute inset-0 rounded-full blur-md opacity-40 bg-gradient-to-tr from-brand-blue-600 via-brand-cyan-500 to-brand-emerald-400"
          style={{ transform: "scale(1.2)" }}
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 transition-transform duration-300 hover:scale-105"
      >
        <defs>
          {/* Gradients for the 4 distinct elements representing Hùng, Đức Anh, Hoàn, Cường */}
          <linearGradient id="symGrad1" x1="10" y1="10" x2="46" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0052cc" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="symGrad2" x1="90" y1="10" x2="54" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="symGrad3" x1="10" y1="90" x2="46" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0041a3" />
            <stop offset="100%" stopColor="#0066cc" />
          </linearGradient>
          <linearGradient id="symGrad4" x1="90" y1="90" x2="54" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          {/* Central pulse dot glow */}
          <radialGradient id="centerCore" cx="50" cy="50" r="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#cffafe" stopOpacity="0.8" />
          </radialGradient>
        </defs>

        {/* 1. Element: Hùng (Top-Left: Innovation & Leadership) */}
        <path
          d="M 22 18 C 14 18 12 24 12 34 L 12 40 C 12 46 16 48 24 48 L 38 48 C 44 48 47 45 47 39 L 47 25 C 47 19 43 18 36 18 Z"
          fill="url(#symGrad1)"
        />

        {/* 2. Element: Đức Anh (Top-Right: Technology & Precision) */}
        <path
          d="M 78 18 C 86 18 88 24 88 34 L 88 40 C 88 46 84 48 76 48 L 62 48 C 56 48 53 45 53 39 L 53 25 C 53 19 57 18 64 18 Z"
          fill="url(#symGrad2)"
        />

        {/* 3. Element: Hoàn (Bottom-Left: Care & Reliability) */}
        <path
          d="M 22 82 C 14 82 12 76 12 66 L 12 60 C 12 54 16 52 24 52 L 38 52 C 44 52 47 55 47 61 L 47 75 C 47 81 43 82 36 82 Z"
          fill="url(#symGrad3)"
        />

        {/* 4. Element: Cường (Bottom-Right: Vitality & Growth - Emerald Touch) */}
        <path
          d="M 78 82 C 86 82 88 76 88 66 L 88 60 C 88 54 84 52 76 52 L 62 52 C 56 52 53 55 53 61 L 53 75 C 53 81 57 82 64 82 Z"
          fill="url(#symGrad4)"
        />

        {/* Center Precision Intersection - Abstract Medical Cross Focal Point */}
        <circle cx="50" cy="50" r="5.5" fill="url(#centerCore)" />
        <circle cx="50" cy="50" r="2" fill="#0052cc" />
      </svg>
    </div>
  );
};

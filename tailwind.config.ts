import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: {
            50: "#f0f7ff",
            100: "#e0effe",
            200: "#bae0fd",
            300: "#7cc5fb",
            400: "#36a4f7",
            500: "#0066cc",
            600: "#0052cc", // Primary Deep Medical Blue
            700: "#0041a3",
            800: "#00327d",
            900: "#001e4d",
          },
          cyan: {
            50: "#ecfeff",
            100: "#cffafe",
            200: "#a5f3fc",
            300: "#67e8f9",
            400: "#22d3ee",
            500: "#06b6d4", // Secondary Aqua/Cyan
            600: "#0891b2",
            700: "#0e7490",
          },
          emerald: {
            50: "#ecfdf5",
            100: "#d1fae5",
            200: "#a7f3d0",
            300: "#6ee7b7",
            400: "#34d399",
            500: "#10b981", // Accent Soft Emerald
            600: "#059669",
            700: "#047857",
          },
          surface: {
            50: "#FFFFFF",
            100: "#F8FAFC",
            200: "#F1F5F9",
            300: "#E2E8F0",
            400: "#CBD5E1",
          },
          dark: {
            800: "#0f172a",
            900: "#0a0f1d",
            950: "#050811",
          }
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        "medical": "0 10px 30px -5px rgba(0, 82, 204, 0.08), 0 4px 6px -2px rgba(0, 82, 204, 0.04)",
        "medical-lg": "0 20px 40px -10px rgba(0, 82, 204, 0.12), 0 8px 12px -3px rgba(0, 82, 204, 0.06)",
        "medical-glow": "0 0 35px rgba(6, 182, 212, 0.22)",
        "card-hover": "0 22px 45px -12px rgba(0, 50, 150, 0.15)",
        "glass": "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "float-reverse": "float-reverse 7s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "float-reverse": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(10px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

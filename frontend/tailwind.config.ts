import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--bg-primary) / <alpha-value>)",
        foreground: "rgb(var(--text-primary) / <alpha-value>)",

        surface: {
          DEFAULT: "rgb(var(--bg-secondary) / <alpha-value>)",
          secondary: "rgb(var(--bg-tertiary) / <alpha-value>)",
          tertiary: "rgb(var(--bg-tertiary-alt) / <alpha-value>)",
          elevated: "rgb(var(--bg-elevated) / <alpha-value>)",
          bg: "rgb(var(--bg-surface) / var(--bg-surface-opacity))",
          glass: "rgb(var(--bg-glass) / var(--bg-glass-opacity))",
          border: "rgb(var(--border-color) / var(--border-opacity))"
        },

        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          light: "rgb(var(--color-primary-light) / var(--color-primary-light-opacity))",
        },
        secondary: {
          DEFAULT: "rgb(var(--color-secondary) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          light: "rgb(var(--color-accent-light) / var(--color-accent-light-opacity))",
        },
        ink: {
          DEFAULT: "rgb(var(--text-primary) / <alpha-value>)",
          secondary: "rgb(var(--text-secondary) / <alpha-value>)",
          tertiary: "rgb(var(--text-tertiary) / <alpha-value>)"
        },
        border: {
          DEFAULT: "rgb(var(--border-color) / <alpha-value>)"
        }
      },

      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem"
      },

      boxShadow: {
        soft: "0 12px 30px rgba(15,23,42,0.08)",
        "soft-lg": "0 24px 60px rgba(15,23,42,0.14)",
        glow: "0 0 60px rgba(249,115,22,0.16)",
        "glow-primary": "0 18px 36px rgba(249,115,22,0.22)",
        card: "0 16px 45px rgba(15,23,42,0.08)"
      },

      backgroundImage: {
        hero: "linear-gradient(180deg, #f8f6f3 0%, #fff 100%)",
        card: "linear-gradient(to bottom right, rgba(255,255,255,0.96), rgba(255,247,237,0.72))",
        "gradient-primary": "linear-gradient(135deg, #f97316 0%, #fb923c 100%)"
      },

      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)"
      },

      transitionProperty: {
        smooth: "all"
      },

      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        skeleton: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        }
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        pulseGlow: "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        skeleton: "skeleton 1.8s ease-in-out infinite",
        "slide-up": "slide-up 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-in-right": "slide-in-right 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        "fade-in": "fade-in 0.2s ease-out",
      }
    }
  },
  plugins: [
    forms,
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".scrollbar-hide": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
          "&::-webkit-scrollbar": {
            display: "none"
          }
        },
        ".transition-smooth": {
          "transition": "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)"
        },
        ".tap-highlight-none": {
          "-webkit-tap-highlight-color": "transparent"
        }
      });
    })
  ]
};

export default config;

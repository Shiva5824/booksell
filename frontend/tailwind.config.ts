import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

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
        soft: "0 10px 30px rgba(0,0,0,0.25)",
        "soft-lg": "0 20px 40px rgba(0,0,0,0.4)",
        glow: "0 0 60px rgba(91,140,255,0.18)",
        "glow-primary": "0 0 40px rgba(91,140,255,0.3)",
        card: "0 8px 30px rgba(0,0,0,0.35)"
      },

      backgroundImage: {
        hero: "radial-gradient(circle at top, rgba(91,140,255,0.18), transparent 40%)",
        card: "linear-gradient(to bottom right, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        "gradient-primary": "linear-gradient(135deg, #5B8CFF 0%, #7C5CFF 100%)"
      },

      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)"
      },
      
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    }
  },
  plugins: [forms]
};

export default config;

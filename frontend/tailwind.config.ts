import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        display: ["var(--font-orbitron)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        twinkle: {
          "0%, 100%": { opacity: "0.15", transform: "scale(0.7)" },
          "50%":     { opacity: "1",    transform: "scale(1.2)" },
        },
        float: {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "50%":      { transform: "translate3d(0,-18px,0)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "50%":      { transform: "translate3d(10px,14px,0)" },
        },
        spin_slow: {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
        spin_reverse: {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(-360deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 30px hsl(186 100% 55% / 0.4), 0 0 80px hsl(186 100% 55% / 0.2)" },
          "50%":      { boxShadow: "0 0 60px hsl(186 100% 55% / 0.7), 0 0 140px hsl(186 100% 55% / 0.4)" },
        },
        "ring-pulse": {
          "0%":   { transform: "scale(1)",   opacity: "0.7" },
          "100%": { transform: "scale(1.6)", opacity: "0"   },
        },
        scan: {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        twinkle: "twinkle 3.5s ease-in-out infinite",
        float: "float 7s ease-in-out infinite",
        "float-slow": "float-slow 12s ease-in-out infinite",
        "spin-slow": "spin_slow 60s linear infinite",
        "spin-reverse": "spin_reverse 90s linear infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "ring-pulse": "ring-pulse 2s ease-out infinite",
        scan: "scan 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

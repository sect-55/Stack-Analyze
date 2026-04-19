import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dt: {
          bg:          "#080c14",
          surface:     "#0d1220",
          surface2:    "#121828",
          border:      "#1e2d47",
          cyan:        "#2244ff",
          "cyan-dim":  "#1a36cc",
          "cyan-glow": "#4466ff",
          blue:        "#3a7fff",
          text:        "#e2eaf8",
          muted:       "#5a7299",
          danger:      "#ff4d6a",
          warning:     "#ffb340",
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      animation: {
        "cyan-glow": "cyan-glow 2.5s ease-in-out infinite",
        "float":     "float-y 4s ease-in-out infinite",
        "scanline":  "scanline 2.2s linear infinite",
      },
      keyframes: {
        "cyan-glow": {
          "0%, 100%": { textShadow: "0 0 10px rgba(34,68,255,0.5)" },
          "50%":       { textShadow: "0 0 20px rgba(68,102,255,0.8), 0 0 50px rgba(34,68,255,0.4)" },
        },
        "float-y": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":       { transform: "translateY(-7px)" },
        },
        "scanline": {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(600%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

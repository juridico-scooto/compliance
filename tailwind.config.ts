import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
      },
      colors: {
        violet: {
          DEFAULT: "#5B2EFF",
          dark: "#4420CC",
          light: "#EDE8FF",
          mid: "#7B55FF",
        },
        magenta: { DEFAULT: "#E8175D", bg: "#FDE8F0" },
        orange: { DEFAULT: "#FF6B00", bg: "#FFF0E5" },
        green: { DEFAULT: "#1DB87A", bg: "#E6F9F1" },
        yellow: { DEFAULT: "#F5A623", bg: "#FEF8EC" },
        "off-white": "#FAF9F6",
        "gray-border": "#E2E0EE",
        "gray-light": "#F0EFF5",
        "gray-mid": "#9B96B8",
        "text-primary": "#1A1035",
        "text-secondary": "#6B6485",
      },
      borderRadius: {
        card: "12px",
        sm: "8px",
      },
    },
  },
  plugins: [],
};
export default config;

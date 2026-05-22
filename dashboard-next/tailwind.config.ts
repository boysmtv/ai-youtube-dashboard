import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        field: "#f9fafb",
        moss: "#465fff",
        clay: "#fb6514",
        brand: {
          25: "#f2f7ff",
          50: "#ecf3ff",
          100: "#dde9ff",
          500: "#465fff",
          600: "#3641f5",
          700: "#2a31d8",
        },
        gray: {
          25: "#fcfcfd",
          50: "#f9fafb",
          100: "#f2f4f7",
          200: "#e4e7ec",
          300: "#d0d5dd",
          500: "#667085",
          700: "#344054",
          900: "#101828",
        },
        success: {
          50: "#ecfdf3",
          500: "#12b76a",
          700: "#027a48",
        },
        warning: {
          50: "#fffaeb",
          500: "#f79009",
          700: "#b54708",
        },
        error: {
          50: "#fef3f2",
          500: "#f04438",
          700: "#b42318",
        },
      },
      fontFamily: {
        display: ["var(--font-outfit)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        panel: "0px 1px 3px rgba(16, 24, 40, 0.10), 0px 1px 2px rgba(16, 24, 40, 0.06)",
        elevated: "0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)",
        focus: "0px 0px 0px 4px rgba(70, 95, 255, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;

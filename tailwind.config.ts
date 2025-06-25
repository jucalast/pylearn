import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // VS Code Dark Theme Colors
        vscode: {
          bg: "#1e1e1e",
          "bg-light": "#272727ff",
          "bg-lighter": "#313131ff",
          "bg-accent": "#3d3d3dff",
          sidebar: "#272727ff",
          "sidebar-light": "#303030ff",
          border: "#333333ff",
          "border-light": "#6a6a6a",
          text: "#cccccc",
          "text-light": "#ffffff",
          "text-muted": "#a1a1a1",
          "text-disabled": "#6a6a6a",
          primary: "#007acc",
          "primary-light": "#0e639c",
          "primary-dark": "#005a9e",
          accent: "#0e7490",
          success: "#4caf50",
          warning: "#ff9800",
          error: "#f44336",
          info: "#2196f3",
        },
        // Custom brand colors
        brand: {
          primary: "#007acc",
          secondary: "#0e7490",
          accent: "#06b6d4",
        }
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)", "Monaco", "Menlo", "Ubuntu Mono", "monospace"],
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "vscode": "0 2px 8px 0 rgba(0, 0, 0, 0.2)",
        "vscode-lg": "0 4px 16px 0 rgba(0, 0, 0, 0.3)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        briefly: {
          bg: "#FFFFFF",
          surface: "#FFFFFF",
          muted: "#F7F7F7",
          text: "#000000",
          secondary: "#333333",
          meta: "#666666",
          line: "rgba(0,0,0,0.06)",
          accent: "#2F6BFF"
        }
      },
      boxShadow: {
        card: "0 6px 20px rgba(0,0,0,0.06)",
        pill: "0 4px 14px rgba(0,0,0,0.06)"
      },
      borderRadius: {
        card: "16px"
      }
    }
  },
  plugins: []
} satisfies Config;


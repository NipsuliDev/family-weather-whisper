
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1400px' }
    },
    extend: {
      colors: {
        // Soothing soft pink palette
        pink: {
          50: "#fff5f9",
          100: "#ffe4ec",
          200: "#ffcbe2",
          300: "#f5b6ce",
          400: "#ee8eb2",
          500: "#e66c96",
          600: "#d84875",
          700: "#be3661",
          800: "#a12a50",
          900: "#841f43",
        },
        accent: {
          sun: "#fff9a3",
          cloud: "#dce5f7",
          rain: "#b6e1fa",
          warn: "#ffd6cc",
        },
        tab: "#ffcbe2",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1.25rem",
        card: "1.5rem"
      },
      boxShadow: {
        card: "0 2px 12px 0 rgba(245, 182, 206, 0.18)"
      },
      backgroundImage: {
        'gradient-pink': "linear-gradient(135deg, #ffe4ec 0%, #ffcbe2 100%)",
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "highlight": "pulse 1s cubic-bezier(0.4,0,0.6,1) infinite",
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

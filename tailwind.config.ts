import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        "life-savers": ['"Life Savers"', "cursive"],
        body: ['"Source Sans 3"', "system-ui", "sans-serif"],
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
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        chalk: {
          yellow: "hsl(var(--chalk-yellow))",
          white: "hsl(var(--chalk-white))",
        },
        board: {
          green: "hsl(var(--board-green))",
          "green-light": "hsl(var(--board-green-light))",
        },
        wood: {
          brown: "hsl(var(--wood-brown))",
        },
        postit: {
          yellow: "hsl(var(--post-it-yellow))",
        },
        calculator: {
          gray: "hsl(var(--calculator-gray))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "25%": { transform: "translateY(-8px) rotate(1deg)" },
          "50%": { transform: "translateY(-4px) rotate(-0.5deg)" },
          "75%": { transform: "translateY(-10px) rotate(0.5deg)" },
        },
        "float-delayed": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "25%": { transform: "translateY(-6px) rotate(-1deg)" },
          "50%": { transform: "translateY(-10px) rotate(0.5deg)" },
          "75%": { transform: "translateY(-4px) rotate(-0.5deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 10px hsl(var(--accent) / 0.5)" },
          "50%": { boxShadow: "0 0 25px hsl(var(--accent) / 0.8)" },
        },
        "glow-pulse-orange": {
          "0%, 100%": {
            boxShadow:
              "0 0 8px hsl(var(--divider-orange) / 0.5), 0 0 16px hsl(var(--divider-orange) / 0.3), 0 2px 4px hsl(var(--divider-orange) / 0.2)",
          },
          "50%": {
            boxShadow:
              "0 0 14px hsl(var(--divider-orange) / 0.8), 0 0 28px hsl(var(--divider-orange) / 0.5), 0 2px 8px hsl(var(--divider-orange) / 0.4)",
          },
        },
        "text-glow-pulse-orange": {
          "0%, 100%": {
            filter: "drop-shadow(0 0 6px hsl(var(--divider-orange) / 0.5))",
          },
          "50%": {
            filter: "drop-shadow(0 0 12px hsl(var(--divider-orange) / 0.8))",
          },
        },
        "glow-pulse-yellow": {
          "0%, 100%": {
            boxShadow:
              "0 0 8px hsl(var(--chalk-yellow) / 0.5), 0 0 16px hsl(var(--chalk-yellow) / 0.3), 0 2px 4px hsl(var(--chalk-yellow) / 0.2)",
          },
          "50%": {
            boxShadow:
              "0 0 14px hsl(var(--chalk-yellow) / 0.8), 0 0 28px hsl(var(--chalk-yellow) / 0.5), 0 2px 8px hsl(var(--chalk-yellow) / 0.4)",
          },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.4s ease-out",
        "accordion-up": "accordion-up 0.1s ease-out",
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float-delayed 7s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "glow-pulse-orange": "glow-pulse-orange 2.5s ease-in-out infinite",
        "text-glow-pulse-orange": "text-glow-pulse-orange 2.5s ease-in-out infinite",
        "glow-pulse-yellow": "glow-pulse-yellow 2.5s ease-in-out infinite",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "scale-in": "scale-in 0.4s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

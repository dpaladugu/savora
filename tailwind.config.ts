
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow:       "hsl(var(--primary-glow))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT:    "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT:    "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        "2xl": "1.25rem",
        xl:    "var(--radius)",
        lg:    "calc(var(--radius) - 2px)",
        md:    "calc(var(--radius) - 4px)",
        sm:    "calc(var(--radius) - 6px)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "SF Pro Display",
          "Inter",
          "-apple-system",
          "sans-serif",
        ],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      spacing: {
        "safe-b": "env(safe-area-inset-bottom, 0px)",
        "safe-t": "env(safe-area-inset-top, 0px)",
      },
      backdropBlur: {
        xs:    "4px",
        "4xl": "48px",
        "5xl": "64px",
      },
      boxShadow: {
        glass:
          "0 1px 0 0 hsl(var(--glass-border, 0 0% 80% / 0.4)), 0 4px 16px -2px hsl(var(--glass-shadow, 0 0% 0% / 0.08)), inset 0 1px 0 0 hsl(0 0% 100% / 0.12)",
        "glass-lg":
          "0 2px 0 0 hsl(var(--glass-border, 0 0% 80% / 0.4)), 0 20px 40px -8px hsl(var(--glass-shadow, 0 0% 0% / 0.12)), inset 0 1px 0 0 hsl(0 0% 100% / 0.16)",
        card:
          "0 1px 2px hsl(0 0% 0% / 0.06), 0 4px 12px -2px hsl(0 0% 0% / 0.08)",
        "card-hover":
          "0 2px 4px hsl(0 0% 0% / 0.06), 0 12px 24px -4px hsl(0 0% 0% / 0.12)",
        glow:
          "0 0 20px hsl(var(--primary) / 0.25), 0 0 40px hsl(var(--primary) / 0.1)",
        "inner-sm":
          "inset 0 1px 2px hsl(0 0% 0% / 0.06)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0.3)" },
          "50%":      { boxShadow: "0 0 0 8px hsl(var(--primary) / 0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-4px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-in":        "fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-up":       "slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in":       "scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        shimmer:          "shimmer 1.5s infinite",
        "pulse-glow":     "pulse-glow 2s ease-in-out infinite",
        float:            "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

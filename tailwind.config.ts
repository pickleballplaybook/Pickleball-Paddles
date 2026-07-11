import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        // ── Admin accent (#3cacae) — used across /admin/* dark pages in place
        //    of the old green-* utilities. Public/marketing pages keep the
        //    existing `brand` teal palette.
        accent: {
          50:  "#eaf7f7",
          100: "#cfeded",
          200: "#a7dfdf",
          300: "#7dd0d1",
          400: "#5cbfc1",
          500: "#3cacae",
          600: "#338f91",
          700: "#2a7375",
          800: "#205758",
          900: "#173e3f",
          950: "#0c2222",
        },
        // ── Brand blue #0a64bc — primary accent across the site. Every
        //    text-brand-*, bg-brand-*, border-brand-* token reads as this
        //    blue (eyebrows, chips, hover states, etc.). Playbook wordmark
        //    overrides to the deeper brand navy #11295f via inline style so
        //    the wordmark itself stays distinct from accent text. Red CTA
        //    palette stays separate for affiliate buy actions.
        brand: {
          50:  "#e7f1fb",
          100: "#c3dcf4",
          200: "#8db9e8",
          300: "#4d95d8",
          400: "#1d77ca",
          500: "#0a64bc",  // ← primary brand blue
          600: "#0954a1",
          700: "#084585",
          800: "#06366a",
          900: "#042549",
          950: "#021631",
        },
        // ── CTA red — primary affiliate/buy/shop action. Matches the blog's
        //    red+white-outline button style and the YouTube thumbnail palette.
        //    Reserved for high-intent conversion actions; teal stays for
        //    navigation, eyebrows, secondary "View" links.
        cta: {
          50:  "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#dc2626",  // ← primary brand red
          600: "#b91c1c",
          700: "#991b1b",
          800: "#7f1d1d",
          900: "#5e1414",
          950: "#3a0a0a",
        },
        // ── Navy (primary buttons, headlines) ────────────────────────────────
        navy: {
          50:  "#f0f4fa",
          100: "#dce6f5",
          200: "#b3c8e8",
          300: "#7aa5d4",
          400: "#4b82bf",
          500: "#2a64a8",
          600: "#1e4d87",
          700: "#163a6a",  // main navy
          800: "#0f2848",
          900: "#0a1c33",
          950: "#060f1e",
        },
        slate: {
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
      boxShadow: {
        card:       "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 4px 16px 0 rgb(0 0 0 / 0.06)",
        "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.06), 0 16px 48px -4px rgb(0 0 0 / 0.12)",
        glow:       "0 0 40px rgb(20 184 166 / 0.18)",
        "navy-glow":"0 0 40px rgb(22 58 106 / 0.20)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out forwards",
        shimmer:   "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;

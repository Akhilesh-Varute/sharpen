/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        ink: "#1c2420",
        "ink-soft": "#57635b",
        "ink-faint": "#8b968d",
        paper: "#f4f6f3",
        bg: "#e9ede9",
        card: "#ffffff",
        line: "#d8ddd5",
        "line-soft": "#e5e8e2",
        accent: "#a8611f",
        "accent-strong": "#8a4d17",
        "accent-soft": "#f1e2cd",
        "accent-ink": "#fffaf3",
        good: "#3c7657",
        "good-soft": "#dfe9e0",
        warn: "#a8432b",
        // dark mode variants, referenced via dark: utilities
        dink: "#eef1ec",
        "dink-soft": "#a8b2a9",
        "dink-faint": "#6c766e",
        dpaper: "#171b18",
        dbg: "#0f1210",
        dcard: "#1e2320",
        dline: "#2c322d",
        "dline-soft": "#242a25",
        daccent: "#d99a52",
        "daccent-strong": "#e8ac6c",
        "daccent-soft": "#3a2c18",
        dgood: "#6bb28c",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Public Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg2: "22px",
        md2: "14px",
        sm2: "9px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,36,32,0.04), 0 8px 24px -12px rgba(28,36,32,0.18)",
        lift: "0 2px 4px rgba(28,36,32,0.06), 0 16px 36px -16px rgba(28,36,32,0.28)",
      },
    },
  },
  plugins: [],
};

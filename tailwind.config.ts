import type { Config } from "tailwindcss";

// Colours come from shared/tokens.css — never hardcode a colour in a component.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        panel: "var(--panel)",
        "panel-2": "var(--panel-2)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        rule: "var(--rule)",
        "rule-2": "var(--rule-2)",
        go: "var(--go)",
        "go-soft": "var(--go-soft)",
        warn: "var(--warn)",
        "warn-soft": "var(--warn-soft)",
        stop: "var(--stop)",
        "stop-soft": "var(--stop-soft)",
        link: "var(--link)",
      },
      fontFamily: {
        mono: "var(--font-mono)",
        sans: "var(--font-sans)",
      },
      borderRadius: { token: "var(--radius)" },
    },
  },
  plugins: [],
};

export default config;

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        tape: "var(--tape)",
        manila: "var(--manila)",
        label: "var(--label)",
        redact: "var(--redact)",
        signal: "var(--signal)",
        alarm: "var(--alarm)",
        ok: "var(--ok)",
        dim: "var(--dim)",
      },
      fontFamily: {
        typewriter: ["'Special Elite'", "monospace"],
        serif: ["'Source Serif 4'", "serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
        handwriting: ["'Caveat'", "'Reenie Beanie'", "cursive"],
      },
      boxShadow: {
        paper: "2px 3px 8px rgba(17, 12, 8, 0.4)",
        desk: "0 10px 25px -5px rgba(0, 0, 0, 0.6)",
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "var(--bg-primary)",
          surface: "var(--bg-secondary)",
          hover: "var(--bg-tertiary)",
          border: "var(--border-muted)",
          "border-focus": "var(--border-focus)",
          text: "var(--text-primary)",
          muted: "var(--text-secondary)",
          dim: "var(--text-muted)",
          accent: "var(--accent-base)",
          "accent-hover": "var(--accent-hover)",
          "accent-faint": "var(--accent-faint)",
          danger: "var(--status-danger)",
          "danger-bg": "var(--status-danger-bg)",
          warning: "var(--status-warning)",
        }
      },
      borderRadius: {
        DEFAULT: "3px",
        sm: "2px",
        md: "4px"
      }
    },
  },
  plugins: [],
}

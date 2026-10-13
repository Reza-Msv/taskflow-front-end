import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: {
          DEFAULT: "hsl(var(--border))",
          strong: "hsl(var(--border-strong))",
          subtle: "hsl(var(--border-subtle))",
        },
        input: {
          DEFAULT: "hsl(var(--input))",
          background: "hsl(var(--input-background))",
          hover: "hsl(var(--input-hover))",
        },
        ring: "hsl(var(--ring))",
        selection: "hsl(var(--selection))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        subtle: "hsl(var(--subtle))",
        placeholder: "hsl(var(--placeholder))",
        inverse: {
          DEFAULT: "hsl(var(--inverse))",
          foreground: "hsl(var(--inverse-foreground))",
        },
        brand: {
          black: "hsl(var(--brand-near-black))",
          orange: {
            DEFAULT: "hsl(var(--brand-orange))",
            hover: "hsl(var(--brand-orange-hover))",
            active: "hsl(var(--brand-orange-active))",
            disabled: "hsl(var(--brand-orange-disabled))",
          },
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--brand-orange-hover))",
          active: "hsl(var(--brand-orange-active))",
          disabled: "hsl(var(--brand-orange-disabled))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          hover: "hsl(var(--secondary-hover))",
          active: "hsl(var(--secondary-active))",
          border: "hsl(var(--secondary-border, var(--border)))",
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
          hover: "hsl(var(--card-hover))",
          selected: "hsl(var(--card-selected))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          active: "hsl(var(--sidebar-active))",
          "active-foreground": "hsl(var(--sidebar-active-foreground))",
        },
        table: {
          header: "hsl(var(--table-header))",
          "row-hover": "hsl(var(--table-row-hover))",
          divider: "hsl(var(--table-divider))",
        },
        status: {
          success: {
            DEFAULT: "hsl(var(--status-success))",
            bg: "hsl(var(--status-success-bg))",
            foreground: "hsl(var(--status-success-foreground))",
          },
          warning: {
            DEFAULT: "hsl(var(--status-warning))",
            bg: "hsl(var(--status-warning-bg))",
            foreground: "hsl(var(--status-warning-foreground))",
          },
          destructive: {
            DEFAULT: "hsl(var(--status-destructive))",
            bg: "hsl(var(--status-destructive-bg))",
            foreground: "hsl(var(--status-destructive-foreground))",
          },
          info: {
            DEFAULT: "hsl(var(--status-info))",
            bg: "hsl(var(--status-info-bg))",
            foreground: "hsl(var(--status-info-foreground))",
          },
          neutral: {
            DEFAULT: "hsl(var(--status-neutral))",
            bg: "hsl(var(--status-neutral-bg))",
            foreground: "hsl(var(--status-neutral-foreground))",
          },
        },
        kanban: {
          backlog: "hsl(var(--kanban-backlog))",
          todo: "hsl(var(--kanban-todo))",
          inprogress: "hsl(var(--kanban-inprogress))",
          inreview: "hsl(var(--kanban-inreview))",
          done: "hsl(var(--kanban-done))",
          blocked: "hsl(var(--kanban-blocked))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "var(--radius-xl)",
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      boxShadow: {
        focus: "0 0 0 3px rgba(255,106,0,0.20)",
        popover: "0 8px 24px rgba(0,0,0,0.12)",
      },
      transitionTimingFunction: {
        DEFAULT: "ease",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

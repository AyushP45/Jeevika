/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}", "./server/src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 40px rgba(18, 185, 129, 0.22)",
        violet: "0 0 44px rgba(139, 92, 246, 0.24)"
      },
      backgroundImage: {
        "jeevika-hero":
          "radial-gradient(circle at 18% 18%, rgba(16,185,129,.24), transparent 30%), radial-gradient(circle at 82% 8%, rgba(139,92,246,.22), transparent 28%), linear-gradient(135deg, #020617 0%, #071221 48%, #08111f 100%)"
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-700px 0" },
          "100%": { backgroundPosition: "700px 0" }
        }
      },
      animation: {
        shimmer: "shimmer 8s linear infinite"
      }
    }
  },
  plugins: []
};

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "public",
      filename: "sw.js",
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "Jeevika Worker Platform",
        short_name: "Jeevika",
        description: "A platform for gig workers and daily wagers to find work.",
        theme_color: "#10b981",
        background_color: "#0f172a",
        display: "standalone",
        icons: [
          {
            src: "/icon.svg",
            sizes: "192x192 512x512",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
  server: {
    port: 5173
  }
});

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// BASE_PATH is set by the Pages workflow ("/repo" for a project site, "" for a custom domain).
const base = `/${(process.env.BASE_PATH ?? "").replace(/^\/+|\/+$/g, "")}/`.replace(/^\/\/$/, "/");

export default defineConfig({
  base,
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  plugins: [react()],
  server: {
    allowedHosts: ["terminal.local"],
    host: "0.0.0.0",
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: "./tests/setup.ts",
  },
});

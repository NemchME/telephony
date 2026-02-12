import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "https://m-dev3.vrn.ru",
        changeOrigin: true,
        secure: false,
      },
      "/ws": {
        target: "wss://m-dev3.vrn.ru",
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
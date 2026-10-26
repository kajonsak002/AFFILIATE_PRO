import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, "sidepanel.html"),
        background: resolve(__dirname, "src/background/index.js"),
        flow_driver: resolve(__dirname, "src/content/flow_driver.js"),
        meta_driver: resolve(__dirname, "src/content/meta_driver.js"),
        tiktok_driver: resolve(__dirname, "src/content/tiktok_driver.js")
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background") return "background.js";
          if (chunkInfo.name === "flow_driver") return "flow_driver.js";
          if (chunkInfo.name === "meta_driver") return "meta_driver.js";
          if (chunkInfo.name === "tiktok_driver") return "tiktok_driver.js";
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]"
      }
    }
  }
});

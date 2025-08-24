import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import path from "path";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        //"@renderer": resolve("src/renderer/src"),
        "@": path.resolve(__dirname, "src/renderer/src"),
        "@shared": path.resolve(__dirname, "src/shared")
      }
    },
    server: {
      fs: {
        allow: [".."] // allow parent folders outside of root
      }
    },
    plugins: [react(), tailwindcss()]
  }
});

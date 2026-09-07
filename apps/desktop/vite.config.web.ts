import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  root: path.resolve(__dirname, "src/renderer"),
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/renderer/src"),
      "@assets": path.resolve(__dirname, "../../assets"),
      "@shared": path.resolve(__dirname, "src/shared")
    }
  },
  plugins: [
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"]
      }
    }),
    tailwindcss()
  ],
  build: {
    outDir: path.resolve(__dirname, "dist/web"),
    emptyOutDir: true
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, "../..")]
    }
  },
  envDir: __dirname
});

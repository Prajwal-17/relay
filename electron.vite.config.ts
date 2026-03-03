import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";
import path from "path";

export default defineConfig({
  main: {
    build: {
      externalizeDeps: {
        exclude: ["electron-updater"]
      }
    }
  },
  preload: {
    build: {
      externalizeDeps: true
    }
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
    plugins: [
      react({
        babel: {
          plugins: ["babel-plugin-react-compiler"]
        }
      }),
      tailwindcss()
    ]
  }
});

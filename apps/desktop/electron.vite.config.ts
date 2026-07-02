import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";
import path, { resolve } from "path";

export default defineConfig({
  main: {
    envPrefix: "M_VITE_",
    build: {
      externalizeDeps: {
        exclude: ["electron-updater"]
      },
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/main/index.ts"),
          server: resolve(__dirname, "src/main/server.ts")
        }
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/preload/index.ts")
        }
      }
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

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";
import path from "path";

// set build mode using cross-env
const buildMode = process.env.VITE_BUILD_MODE ?? "prod";

export default defineConfig({
  main: {
    envPrefix: "M_VITE_",
    define: {
      "import.meta.env.VITE_BUILD_MODE": JSON.stringify(buildMode)
    },
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

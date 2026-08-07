import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src/renderer/src", import.meta.url)),
      "@shared": fileURLToPath(new URL("./src/shared", import.meta.url))
    }
  },
  test: {
    exclude: ["**/node_modules/**"],
    setupFiles: ["src/main/tests/setup/database.mock.ts"] // runs before every test file
  }
});

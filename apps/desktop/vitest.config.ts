import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["**/node_modules/**"],
    setupFiles: ["src/main/tests/setup/database.mock.ts"] // runs before every test file
  }
});

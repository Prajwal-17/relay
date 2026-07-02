import { config as reactInternalConfig } from "@repo/eslint-config/react-internal";
import eslintPluginReactRefresh from "eslint-plugin-react-refresh";

export default [
  ...reactInternalConfig,
  {
    ignores: ["**/node_modules", "**/dist", "**/out", "src/renderer/src/components/ui/**"]
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-refresh": eslintPluginReactRefresh
    },
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      ...eslintPluginReactRefresh.configs.vite.rules
    }
  }
];

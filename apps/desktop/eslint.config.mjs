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
      "@typescript-eslint/ban-ts-comment": "off",
      "no-restricted-syntax": [
        "warn",
        {
          selector: "Literal[value=/text-\\[\\d+(px|rem)\\]/]",
          message:
            "Arbitrary text-[NNpx] values are forbidden — use a Tailwind token (text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl). See docs/DESIGN.md §3.4 and §8."
        }
      ],
      ...eslintPluginReactRefresh.configs.vite.rules
    }
  }
];

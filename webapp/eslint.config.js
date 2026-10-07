import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";
import {defineConfig} from "eslint/config";

export default defineConfig(
  {ignores: ["../dist/**", "coverage/**"]},
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {tsconfigRootDir: import.meta.dirname},
      globals: {...globals.browser, ...globals.es2022},
    },
    rules: {
      eqeqeq: ["error", "smart"],
      "no-console": ["warn", {allow: ["info", "warn", "error"]}],
      "max-params": ["error", 3],
      "no-restricted-imports": ["error", {patterns: ["../*", "../**"]}],
      "no-restricted-syntax": [
        "error",
        {selector: "ConditionalExpression", message: "Use an explicit if statement instead of a ternary."},
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unused-vars": ["error", {argsIgnorePattern: "^_", varsIgnorePattern: "^_"}],
    },
  },
  {
    files: ["*.{js,ts}"],
    languageOptions: {globals: {...globals.node}},
  },
  prettierConfig,
  {rules: {curly: ["error", "multi-line"]}},
);

// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [...compat.extends("next/core-web-vitals", "next/typescript"), {
  rules: {
    // Disable strict TypeScript rules during builds
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-empty-function": "warn",
    "@typescript-eslint/ban-ts-comment": "warn",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/prefer-optional-chain": "warn",
    "@typescript-eslint/prefer-nullish-coalescing": "warn",
    // General rules
    "no-console": "warn",
    "no-debugger": "warn",
    "prefer-const": "warn",
  },
  // Ignore patterns for build
  ignorePatterns: [
    ".next/**/*",
    "node_modules/**/*",
    "out/**/*",
    "dist/**/*",
    "build/**/*"
  ]
}, ...storybook.configs["flat/recommended"]];

export default eslintConfig;

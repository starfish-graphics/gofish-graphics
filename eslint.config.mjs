import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ["dist", "coverage", "node_modules"] },

  ...tseslint.configs.recommended,

  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        // CHANGE THIS: Point directly to the file
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/return-await": ["error", "in-try-catch"],
    },
  },
];

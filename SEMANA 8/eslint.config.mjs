import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/**", ".venv/**", "certs/**", "coverage/**", "prisma/**"]
  },
  {
    files: ["**/*.js"],
    ...js.configs.recommended,
    languageOptions: {
      globals: { ...globals.node }
    }
  },
  {
    files: ["public/js/**/*.js"],
    languageOptions: {
      sourceType: "module",
      globals: { ...globals.browser }
    }
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        describe: "readonly",
        test: "readonly",
        expect: "readonly",
        jest: "readonly",
        beforeEach: "readonly",
        afterAll: "readonly"
      }
    }
  }
];
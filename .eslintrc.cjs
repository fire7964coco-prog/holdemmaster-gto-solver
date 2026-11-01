require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:vue/vue3-recommended",
    "@vue/eslint-config-typescript/recommended",
    "@vue/eslint-config-prettier",
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    // French labels and their quoted documentation intentionally contain U+202F.
    // Preserve these literals/comments; irregular whitespace in executable code is still checked.
    "no-irregular-whitespace": ["error", {
      skipStrings: true,
      skipTemplates: true,
      skipComments: true,
    }],
    // Worker cleanup callbacks reference the timer before its later assignment.
    // Keep that declaration order while retaining prefer-const for other variables.
    "prefer-const": ["error", { ignoreReadBeforeAssign: true }],
  },
};

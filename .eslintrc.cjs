// .eslintrc.cjs
module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "next/typescript"],
  rules: {
    // keep UI strict by default
  },
  overrides: [
    // Loosen rules inside API routes and server code (runtime-first)
    {
      files: [
        "src/app/api/**/*.ts",
        "src/app/api/**/*.tsx",
        "src/server/**/*.ts",
        "src/server/**/*.tsx",
      ],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "prefer-const": "off",
      },
    },
  ],
};

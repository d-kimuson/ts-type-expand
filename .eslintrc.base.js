module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 6,
    sourceType: "module",
    project: "./**/tsconfig.json",
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/naming-convention": "warn",
    "@typescript-eslint/ban-ts-ignore": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/naming-convention": [
      "warn",
      {
        selector: "typeProperty",
        format: ["strictCamelCase"],
        filter: {
          regex: "__",
          match: false,
        },
      },
    ],
    curly: "warn",
    eqeqeq: "warn",
    "no-throw-literal": "warn",
    "no-console": "off",
  },
  ignorePatterns: ["**/*.d.ts"],
}

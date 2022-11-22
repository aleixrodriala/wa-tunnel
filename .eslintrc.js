module.exports = {
  env: {
    es2021: true,
    browser: true,
    commonjs: true,
  },
  extends: ["prettier", "airbnb-base", "plugin:prettier/recommended"],
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: {
    indent: 0,
    "no-var": 1,
    radix: "off",
    "no-console": 1,
    "no-void": "off",
    "no-else-return": 1,
    semi: [1, "always"],
    "space-unary-ops": 2,
    "no-plusplus": "off",
    "no-unused-vars": "off",
    "no-cond-assign": "off",
    "prettier/prettier": "error",
    "no-restricted-syntax": "off",
    "no-extra-boolean-cast": "off",
    "no-empty": [
      "error",
      {
        allowEmptyCatch: true,
      },
    ],
  },
};

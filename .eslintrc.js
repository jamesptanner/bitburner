
module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es6: true
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
       // 'plugin:@typescript-eslint/recommended-requiring-type-checking'
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 8,
        sourceType: "module",
        ecmaFeatures: {
            experimentalObjectRestSpread: true
        },
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname
    },
    plugins: ["@typescript-eslint"],
    ignorePatterns: ['*.d.ts', 'build/*', 'dist/**', 'docs/**'],
    rules: {
        'no-constant-condition': ['off'],
        "@typescript-eslint/no-floating-promises": "error",
        "block-scoped-var": "error",
        "consistent-return":"error",
        "dot-notation":"error",
        "eqeqeq":"error",
        "no-alert":"error",
        "no-console":"error",
        "no-debugger":"error",
        "no-var":"error",

    },
};
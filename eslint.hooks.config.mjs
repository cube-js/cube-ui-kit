// Report-only React Hooks / React Compiler diagnostics.
//
// This config is NOT part of `pnpm lint`. It is consumed by
// `scripts/form-diagnostics.mjs`, which records the official
// `eslint-plugin-react-hooks` (v7, compiler-backed) findings for the Form
// surface and compares them against a committed baseline — see
// `src/components/form/Form/legacy-contract/README.md`.
//
// Every rule runs at `warn`: the point is to *see* the diagnostics, not to fail
// the build on them. Zero is not yet required (Form modernization plan, §8.1).
import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';

const recommended = reactHooks.configs.recommended.rules;

const rules = Object.fromEntries(
  Object.keys(recommended).map((rule) => [rule, 'warn']),
);

export default [
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      '**/*.test.{ts,tsx}',
      '**/*.browser.test.{ts,tsx}',
      '**/*.stories.{ts,tsx}',
      '**/legacy-contract/**',
      '**/__mocks__/**',
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { 'react-hooks': reactHooks },
    rules,
  },
];

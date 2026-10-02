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
import tasty from '@tenphi/eslint-plugin-tasty';
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
      // Type-error fixtures intentionally contain forbidden operations.
      '**/*.test-d.tsx',
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
    // `tasty` is registered, with none of its rules on, only so the source's
    // `eslint-disable-next-line tasty/…` comments resolve: an unknown rule in a
    // directive is reported as a finding against that rule. Those directives
    // are for oxlint, which runs the tasty rules, so they are never "used" here
    // and unused-directive reports are off.
    plugins: { 'react-hooks': reactHooks, tasty },
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    rules,
  },
];

import tasty from '@tenphi/eslint-plugin-tasty';
import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';

import { effectEventImports } from './scripts/hooks-policy.mjs';

export const runtimePatterns = ['src/**/*.{ts,tsx}'];

const ignores = {
  ignores: [
    '**/*.test.{ts,tsx}',
    '**/*.test-d.tsx',
    '**/*.browser.test.{ts,tsx}',
    '**/*.stories.{ts,tsx}',
    '**/*.fixture.{ts,tsx}',
    '**/*.d.ts',
    'src/test/**',
    'src/stories/**',
    '**/legacy-contract/**',
    '**/__mocks__/**',
    'src/eslint-plugin/fixtures.tsx',
  ],
};

const common = {
  files: runtimePatterns,
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
    },
  },
  // Tasty directives belong to Oxlint; registering the plugin resolves them here.
  plugins: {
    'react-hooks': reactHooks,
    tasty,
    uikit: { rules: { 'effect-event-imports': effectEventImports } },
  },
  linterOptions: { reportUnusedDisableDirectives: 'off' },
};

export const strictHooksConfig = [
  ignores,
  {
    ...common,
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'uikit/effect-event-imports': 'error',
    },
  },
];

// Existing recommended-rule debt is ratcheted; Effect Event adopters also get
// the strict pass above with inline directives disabled by the report runner.
export default [
  ignores,
  {
    ...common,
    rules: {
      ...Object.fromEntries(
        Object.keys(reactHooks.configs.recommended.rules).map((rule) => [
          rule,
          'warn',
        ]),
      ),
      'uikit/effect-event-imports': 'error',
    },
  },
];

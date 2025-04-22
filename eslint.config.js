import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import storybookPlugin from 'eslint-plugin-storybook';
import importPlugin from 'eslint-plugin-import';
import { FlatCompat } from '@eslint/eslintrc';
import tsParser from '@typescript-eslint/parser';
import tseslint from '@typescript-eslint/eslint-plugin';
import path from 'path';
import { fileURLToPath } from 'url';

// Needed for ESLint config compatibility layer
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Compatibility layer for eslintrc configs
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  // Use JS recommended rules
  js.configs.recommended,

  // Use legacy configs through the compatibility layer
  ...compat.extends(
    'prettier',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
  ),

  // Global configuration
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        parser: tsParser,
        parserOptions: { project: './tsconfig.json' },
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      storybook: storybookPlugin,
      import: importPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'react/boolean-prop-naming': [
        'error',
        {
          rule: '^is[A-Z]([A-Za-z0-9]?)+',
          message: 'Boolean props should have `is` prefix',
        },
      ],
      'react/display-name': 'error',
      'react/prop-types': 'warn',
      'react/jsx-sort-props': [
        'error',
        {
          callbacksLast: true,
          shorthandFirst: true,
          shorthandLast: false,
          noSortAlphabetically: true,
          reservedFirst: true,
        },
      ],

      'import/extensions': 0,
      'import/no-unresolved': 0,
      'import/no-anonymous-default-export': 0,
      'import/no-extraneous-dependencies': 'error',
      'import/no-unused-modules': 'error',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
        },
      ],

      '@typescript-eslint/ban-types': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-unused-vars': 'error',

      'react-hooks/exhaustive-deps': 'warn',

      'prefer-const': 0,
      'comma-dangle': 0,
      'no-console': 0,
      'arrow-parens': 0,
      'no-prototype-builtins': 0,
      'class-methods-use-this': 0,
      'no-param-reassign': 0,
      'no-mixed-operators': 0,
      'no-else-return': 0,
      'prefer-promise-reject-errors': 0,
    },
  },

  // File-specific overrides
  {
    files: ['./scripts/**/*.js', './scripts/**/*.mjs'],
    rules: {
      '@typescript-eslint/no-var-requires': 0,
    },
  },
  {
    files: ['*.stories.tsx', '**/storybook/**/*.tsx'],
    rules: {
      'react/function-component-definition': 0,
      'react/boolean-prop-naming': 0,
      'react/prop-types': 0,
      'react/no-unescaped-entities': 0,
    },
  },
  {
    files: ['*.test.ts', '*.test.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'react/prop-types': 'off',
    },
  },
  {
    files: ['*.ts', '*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react/prop-types': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react/boolean-prop-naming': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/ban-types': 'off',
    },
  },

  // Ignore patterns
  {
    ignores: ['*.js'],
  },
];

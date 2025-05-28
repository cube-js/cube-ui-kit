// eslint.config.js
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import storybookPlugin from 'eslint-plugin-storybook';
import globals from 'globals';

export default [
  // Base JS recommended rules
  js.configs.recommended,

  // Base configuration for all files
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      storybook: storybookPlugin,
      import: importPlugin,
      '@typescript-eslint': tseslint,
      'jsx-a11y': jsxA11yPlugin,
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
      // Core rules
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
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
      ],

      // React rules
      'react/boolean-prop-naming': [
        'error',
        {
          rule: '^(is|use|active|should|default|show|hide|are|does|do|when|include|allow|auto|preserve|no|danger|serif|apply|fonts|disable)([A-Z]([A-Za-z0-9]?)+|)',
          message:
            'Boolean props should have `is|use|active|should|default|show|hide|are|does|do|when|include|allow|auto|preserve|no|danger|serif|apply|fonts|disable` prefix',
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

      // Import rules
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

      // React Hooks rules
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      // We need to disable JS rule and enable TS-specific one
      'no-unused-vars': 'off',

      // These rules are manually set to match the original rules
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Script files override
  {
    files: ['./scripts/**/*.{cjs,js,mjs}'],
    rules: {
      // Cannot check since no-var-requires might be missing in the current TS ESLint plugin
      'no-var-requires': 'off',
    },
  },

  // Storybook files override
  {
    files: ['**/*.stories.tsx', '**/storybook/**/*.tsx'],
    rules: {
      'react/function-component-definition': 0,
      'react/boolean-prop-naming': 0,
      'react/prop-types': 0,
      'react/no-unescaped-entities': 0,
    },
  },

  // Test files override
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-unused-vars': 'off',
      'react/prop-types': 'off',
      'no-undef': 'off',
    },
  },

  // All TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'react/prop-types': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react/boolean-prop-naming': 'off',
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': [
        'error',
        { ignoreDeclarationMerge: true },
      ],
    },
  },

  // Apply specific ignore patterns
  {
    ignores: ['*.js', '*.d.ts'],
  },
];

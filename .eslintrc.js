// @ts-check

module.exports = /** @type {import('eslint').Linter.Config} */ ({
  extends: [
    'prettier',
    'react-app',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:storybook/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
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
  overrides: [
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
      },
    },
  ],
});

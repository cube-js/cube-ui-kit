// @ts-check

module.exports = /** @type {import('eslint').Linter.Config} */ ({
  extends: [
    'prettier',
    'react-app',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: [],
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

    'import/no-cycle': 'error',
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'import/no-anonymous-default-export': 'error',
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

    'prefer-const': 'off',
    'comma-dangle': 'off',
    'no-console': 'off',
    'arrow-parens': 'off',
    'no-prototype-builtins': 'off',
    'class-methods-use-this': 'off',
    'no-param-reassign': 'off',
    'no-mixed-operators': 'off',
    'no-else-return': 'off',
    'prefer-promise-reject-errors': 'off',
  },
  overrides: [
    {
      files: ['./scripts/**/*.js', './scripts/**/*.mjs'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      extends: ['plugin:testing-library/react', 'plugin:storybook/recommended'],
      files: [
        '**/storybook/**/*.jsx',
        '**/storybook/**/*.js',
        '**/storybook/**/*.tsx',
        '**/storybook/**/*.ts',

        '*.stories.jsx',
        '*.stories.js',
        '*.stories.tsx',
        '*.stories.ts',
      ],
      rules: {
        'react/function-component-definition': 'off',
        'react/boolean-prop-naming': 'off',
        'react/prop-types': 'off',
        'react/no-unescaped-entities': 'off',

        'testing-library/prefer-screen-queries': 'off',
        'testing-library/no-node-access': 'warn',
      },
    },
    {
      extends: ['plugin:testing-library/react'],
      files: ['*.test.ts', '*.test.tsx'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',

        'react/prop-types': 'off',

        'testing-library/prefer-screen-queries': 'off',
        'testing-library/no-node-access': 'warn',
        'testing-library/no-unnecessary-act': 'warn',
      },
    },
  ],
});

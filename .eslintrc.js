module.exports = {
  extends: [
    'prettier',
    'react-app',
    'plugin:storybook/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    'import/extensions': 0,
    'import/no-unresolved': 0,
    'import/no-anonymous-default-export': 0,
    '@typescript-eslint/ban-types': 1,
    '@typescript-eslint/ban-ts-comment': 1,
    '@typescript-eslint/no-empty-function': 0,
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
    'react-hooks/exhaustive-deps': 0,
    'max-len': [
      'error',
      120,
      2,
      {
        ignoreUrls: true,
        ignoreComments: true,
        ignoreRegExpLiterals: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      },
    ],
  },
  overrides: [
    {
      files: ['./scripts/**/*.js', './scripts/**/*.mjs'],
      rules: {
        '@typescript-eslint/no-var-requires': 0,
      },
    },
  ],
};

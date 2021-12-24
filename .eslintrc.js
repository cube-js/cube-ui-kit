module.exports = {
  'extends': ["react-app", "prettier", "plugin:storybook/recommended"],
  'rules': {
    'import/no-unresolved': 0,
    'comma-dangle': 0,
    'no-console': 0,
    'arrow-parens': 0,
    'import/extensions': 0,
    'quotes': [1, 'single'],
    'no-prototype-builtins': 0,
    'class-methods-use-this': 0,
    'no-param-reassign': 0,
    'no-mixed-operators': 0,
    'no-else-return': 0,
    'prefer-promise-reject-errors': 0,
    'react-hooks/exhaustive-deps': 0,
    'operator-linebreak': ['error', 'before'],
    'import/no-anonymous-default-export': 0,
    'space-before-function-paren': [1, 'never'],
    'space-before-blocks': [1, 'always'],
    'max-len': ['error', 120, 2, {
      ignoreUrls: true,
      ignoreComments: true,
      ignoreRegExpLiterals: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true
    }]
  }
};
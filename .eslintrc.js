module.exports = {
  'extends': ['react-app'],
  'rules': {
    'max-len': ['error', 120, 2, {
      ignoreUrls: true,
      ignoreComments: true,
      ignoreRegExpLiterals: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
    }],
    'no-sparse-arrays': 0,
  }
};

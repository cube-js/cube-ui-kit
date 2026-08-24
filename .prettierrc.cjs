module.exports = {
  singleQuote: true,
  trailingComma: 'all',
  // Markdown/MDX prose is never hard-wrapped: one paragraph is one line.
  proseWrap: 'never',
  importOrder: [
    '^:node',
    '<BUILTIN_MODULES>',
    '',
    '<THIRD_PARTY_MODULES>',
    '',
    '^[.]{2,}',
    '',
    '^[.]/(?!index)',
    '',
    '^[./]',
    '',
    '<TYPES>',
    '<TYPES>^[.]{2,}',
    '<TYPES>^[./]',
  ],
  importOrderTypeScriptVersion: '5.0.0',
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
  overrides: [
    {
      // Code fences in docs are illustrative snippets, not source files.
      files: ['*.md', '*.mdx'],
      options: { embeddedLanguageFormatting: 'off' },
    },
  ],
};

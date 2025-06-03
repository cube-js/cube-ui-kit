import { ensureYamlSqlExtensions, Prism } from '../prismSetup';

describe('Prism diff-highlight plugin', () => {
  const code = `+console.log('hi');\n-const a = 1;`;

  let capturedTokens: any;

  // Capture tokens from the hook
  const originalHook =
    Prism.hooks.all['after-tokenize'][
      Prism.hooks.all['after-tokenize'].length - 1
    ];
  Prism.hooks.all['after-tokenize'][
    Prism.hooks.all['after-tokenize'].length - 1
  ] = function (env: any) {
    originalHook.call(this, env);
    if (env.language === 'diff-javascript') {
      capturedTokens = env.tokens;
    }
  };

  // Trigger hooks by using Prism.highlight
  const lang = 'diff-javascript';
  Prism.highlight(code, Prism.languages.diff, lang);

  const tokens = capturedTokens;

  test('inserted line is tokenised with inner language', () => {
    const inserted = tokens.find(
      (t: any) => typeof t !== 'string' && t.type === 'inserted-sign',
    ) as any;

    // sanity check: diff token exists
    expect(inserted).toBeDefined();

    const lineToken = (inserted.content as any[]).find(
      (c: any) => typeof c !== 'string' && c.type === 'line',
    ) as any;

    expect(lineToken).toBeDefined();

    // The plugin should have replaced the plain string content of `line` with
    // a nested token array produced by the real language grammar.
    expect(Array.isArray(lineToken.content)).toBe(true);

    // There should be at least one non-string token inside (e.g., a keyword or punctuation)
    const hasNested = (lineToken.content as any[]).some(
      (n) => typeof n !== 'string',
    );
    expect(hasNested).toBe(true);
  });

  test('manually set diff-sql language produces nested tokens', () => {
    const sqlCode = `+SELECT id, name FROM users WHERE active = 1;\n-SELECT * FROM users;`;

    // Manually trigger with diff-sql language
    let capturedTokens: any;
    const originalHook =
      Prism.hooks.all['after-tokenize'][
        Prism.hooks.all['after-tokenize'].length - 1
      ];
    Prism.hooks.all['after-tokenize'][
      Prism.hooks.all['after-tokenize'].length - 1
    ] = function (env: any) {
      originalHook.call(this, env);
      if (env.language === 'diff-sql') {
        capturedTokens = env.tokens;
      }
    };

    // Test with diff-sql language
    Prism.highlight(sqlCode, Prism.languages.diff, 'diff-sql');

    expect(capturedTokens).toBeDefined();

    const inserted = capturedTokens.find(
      (t: any) => typeof t !== 'string' && t.type === 'inserted-sign',
    ) as any;

    expect(inserted).toBeDefined();

    const lineToken = (inserted.content as any[]).find(
      (c: any) => typeof c !== 'string' && c.type === 'line',
    ) as any;

    expect(lineToken).toBeDefined();
    expect(Array.isArray(lineToken.content)).toBe(true);

    // Should contain SQL keywords
    const hasKeyword = (lineToken.content as any[]).some(
      (n) => typeof n !== 'string' && n.type === 'keyword',
    );
    expect(hasKeyword).toBe(true);
  });

  test('direct Highlight usage with diff-sql language works', () => {
    // Test that diff-sql language works when manually specified
    const sqlCode = `+SELECT id, name FROM users WHERE active = 1;\n-SELECT * FROM users;`;

    // Capture tokens from manual diff-sql usage
    let capturedTokens: any;
    const originalHook =
      Prism.hooks.all['after-tokenize'][
        Prism.hooks.all['after-tokenize'].length - 1
      ];
    Prism.hooks.all['after-tokenize'][
      Prism.hooks.all['after-tokenize'].length - 1
    ] = function (env: any) {
      originalHook.call(this, env);
      if (env.language === 'diff-sql') {
        capturedTokens = env.tokens;
      }
    };

    // This simulates what happens when someone uses <Highlight language="diff-sql">
    Prism.highlight(
      sqlCode,
      Prism.languages['diff-sql'] || Prism.languages.diff,
      'diff-sql',
    );

    expect(capturedTokens).toBeDefined();
    expect(capturedTokens.length).toBeGreaterThan(0);

    // Find inserted sign token
    const inserted = capturedTokens.find(
      (t: any) => typeof t !== 'string' && t.type === 'inserted-sign',
    ) as any;
    expect(inserted).toBeDefined();

    const lineToken = (inserted.content as any[]).find(
      (c: any) => typeof c !== 'string' && c.type === 'line',
    ) as any;

    expect(lineToken).toBeDefined();
    expect(Array.isArray(lineToken.content)).toBe(true);

    // Should contain SQL keywords
    const hasKeyword = (lineToken.content as any[]).some(
      (n) => typeof n !== 'string' && n.type === 'keyword',
    );
    expect(hasKeyword).toBe(true);
  });

  test('PrismDiffCode generates proper diff-sql tokens', () => {
    // Test the actual diffLines logic from PrismDiffCode
    const { diffLines } = require('diff');

    const original = `SELECT id, name FROM users;`;
    const modified = `SELECT id, name, email FROM users WHERE active = 1;`;

    const diff = diffLines(original, modified);
    const diffString = diff
      .map((part: any) => {
        const value = part.value.trimEnd();
        if (part.added) {
          return value
            .split('\n')
            .map((val: string) => (val ? `+${val}` : ''))
            .join('\n');
        }
        if (part.removed) {
          return value
            .split('\n')
            .map((val: string) => (val ? `-${val}` : ''))
            .join('\n');
        }
        return value
          .split('\n')
          .map((val: string) => (val ? ` ${val}` : ''))
          .join('\n');
      })
      .join('\n');

    // Now test that this diff string works with our plugin
    let capturedTokens: any;
    const originalHook =
      Prism.hooks.all['after-tokenize'][
        Prism.hooks.all['after-tokenize'].length - 1
      ];
    Prism.hooks.all['after-tokenize'][
      Prism.hooks.all['after-tokenize'].length - 1
    ] = function (env: any) {
      originalHook.call(this, env);
      if (env.language === 'diff-sql') {
        capturedTokens = env.tokens;
      }
    };

    // Manually register diff-sql like PrismCode does
    if (!Prism.languages['diff-sql']) {
      Prism.languages['diff-sql'] = Prism.languages.diff;
    }

    Prism.highlight(diffString, Prism.languages.diff, 'diff-sql');

    expect(capturedTokens).toBeDefined();

    // Find any added lines that should have SQL highlighting
    const addedTokens = capturedTokens.filter(
      (t: any) => typeof t !== 'string' && t.type === 'inserted-sign',
    );

    expect(addedTokens.length).toBeGreaterThan(0);

    // Check that at least one added line has nested SQL tokens
    const hasNestedSql = addedTokens.some((token: any) => {
      const lineToken = (token.content as any[]).find(
        (c: any) => typeof c !== 'string' && c.type === 'line',
      );
      return (
        lineToken &&
        Array.isArray(lineToken.content) &&
        (lineToken.content as any[]).some(
          (n) =>
            typeof n !== 'string' &&
            (n.type === 'keyword' || n.type === 'function'),
        )
      );
    });

    expect(hasNestedSql).toBe(true);
  });

  test('YAML grammar supports SQL highlighting in sql fields', () => {
    ensureYamlSqlExtensions();

    const yamlCode = `cubes:
  - name: orders
    sql: SELECT id, name FROM orders WHERE active = 1
    measures:
      - name: count
        sql: COUNT(*)`;

    const tokens = Prism.tokenize(yamlCode, Prism.languages.yaml, 'yaml');

    // Check if SQL tokens are present
    const hasKeywords = JSON.stringify(tokens).includes('"keyword"');
    const hasSqlKeywords =
      JSON.stringify(tokens).includes('SELECT') ||
      JSON.stringify(tokens).includes('COUNT');

    expect(hasKeywords).toBe(true);
    expect(hasSqlKeywords).toBe(true);
  });

  test('YAML grammar supports SQL highlighting in multiline folded blocks', () => {
    ensureYamlSqlExtensions();

    const yamlCode = `cubes:
  - name: orders
    sql: >
      SELECT 1 as id, 100 as amount, 'new' status
      UNION ALL
      SELECT 2 as id, 200 as amount, 'new' status`;

    const tokens = Prism.tokenize(yamlCode, Prism.languages.yaml, 'yaml');

    // Check if SQL tokens are present in the multiline block
    const hasKeywords = JSON.stringify(tokens).includes('"keyword"');
    const hasSqlKeywords =
      JSON.stringify(tokens).includes('SELECT') ||
      JSON.stringify(tokens).includes('UNION');

    expect(hasKeywords).toBe(true);
    expect(hasSqlKeywords).toBe(true);
  });

  test('PrismDiffCode with YAML containing multiline SQL blocks', () => {
    ensureYamlSqlExtensions();

    // Test that PrismDiffCode properly handles YAML with multiline SQL
    const { diffLines } = require('diff');

    const originalYaml = `cubes:
  - name: orders
    sql: >
      SELECT id, amount, status
      FROM orders
      WHERE active = 1
    measures:
      - name: count
        type: count`;

    const modifiedYaml = `cubes:
  - name: orders
    sql: >
      SELECT id, amount, status, created_at
      FROM orders
      WHERE active = 1 AND status != 'cancelled'
    measures:
      - name: count
        type: count
      - name: total_amount
        sql: amount
        type: sum`;

    const diff = diffLines(originalYaml, modifiedYaml);
    const diffString = diff
      .map((part: any) => {
        const value = part.value.trimEnd();
        if (part.added) {
          return value
            .split('\n')
            .map((val: string) => (val ? `+${val}` : ''))
            .join('\n');
        }
        if (part.removed) {
          return value
            .split('\n')
            .map((val: string) => (val ? `-${val}` : ''))
            .join('\n');
        }
        return value
          .split('\n')
          .map((val: string) => (val ? ` ${val}` : ''))
          .join('\n');
      })
      .join('\n');

    // Capture tokens from diff-yaml processing
    let capturedTokens: any;
    const originalHook =
      Prism.hooks.all['after-tokenize'][
        Prism.hooks.all['after-tokenize'].length - 1
      ];
    Prism.hooks.all['after-tokenize'][
      Prism.hooks.all['after-tokenize'].length - 1
    ] = function (env: any) {
      originalHook.call(this, env);
      if (env.language === 'diff-yaml') {
        capturedTokens = env.tokens;
      }
    };

    // Manually register diff-yaml like PrismDiffCode would
    if (!Prism.languages['diff-yaml']) {
      Prism.languages['diff-yaml'] = Prism.languages.diff;
    }

    // Process the diff string with diff-yaml language
    Prism.highlight(diffString, Prism.languages.diff, 'diff-yaml');

    expect(capturedTokens).toBeDefined();

    // Check that we have diff tokens (added/removed lines)
    const hasAddedTokens = capturedTokens.some(
      (t: any) => typeof t !== 'string' && t.type === 'inserted-sign',
    );
    const hasRemovedTokens = capturedTokens.some(
      (t: any) => typeof t !== 'string' && t.type === 'deleted-sign',
    );

    expect(hasAddedTokens).toBe(true);
    expect(hasRemovedTokens).toBe(true);

    // Check that within the diff tokens, we have nested YAML and SQL highlighting
    const diffTokens = capturedTokens.filter(
      (t: any) =>
        typeof t !== 'string' &&
        (t.type === 'inserted-sign' || t.type === 'deleted-sign'),
    );

    // Look for nested SQL tokens within the YAML content
    const hasNestedSqlHighlighting = diffTokens.some((token: any) => {
      const lineTokens = Array.isArray(token.content)
        ? token.content.filter(
            (c: any) => typeof c !== 'string' && c.type === 'line',
          )
        : [];

      return lineTokens.some((lineToken: any) => {
        if (!Array.isArray(lineToken.content)) return false;

        // Check for SQL keywords, YAML keys, or sql-scalar tokens
        const tokenString = JSON.stringify(lineToken.content);
        return (
          (tokenString.includes('"keyword"') &&
            (tokenString.includes('SELECT') ||
              tokenString.includes('WHERE') ||
              tokenString.includes('FROM'))) ||
          tokenString.includes('"sql-scalar"')
        );
      });
    });

    expect(hasNestedSqlHighlighting).toBe(true);
  });
});

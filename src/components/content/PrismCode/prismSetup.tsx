// @ts-nocheck
/* eslint-disable */
// This file patches Prism with extra languages & plugins for prism-react-renderer
// Its content is mostly vanilla JS copied from Prism, so type-checking is disabled above.
import { Prism as RendererPrism } from 'prism-react-renderer';

// make the instance globally visible for other plugins (optional)
(globalThis as any).Prism = RendererPrism;

RendererPrism.languages.sql = {
  comment: {
    pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|(?:--|\/\/|#).*)/,
    lookbehind: true,
  },
  variable: [
    {
      pattern: /@(["'`])(?:\\[\s\S]|(?!\1)[^\\])+\1/,
      greedy: true,
    },
    /@[\w.$]+/,
  ],
  string: {
    pattern: /(^|[^@\\])("|')(?:\\[\s\S]|(?!\2)[^\\]|\2\2)*\2/,
    greedy: true,
    lookbehind: true,
  },
  identifier: {
    pattern: /(^|[^@\\])`(?:\\[\s\S]|[^`\\]|``)*`/,
    greedy: true,
    lookbehind: true,
    inside: {
      punctuation: /^`|`$/,
    },
  },
  function:
    /\b(?:AVG|COUNT|FIRST|FORMAT|LAST|LCASE|LEN|MAX|MID|MIN|MOD|NOW|ROUND|SUM|UCASE)(?=\s*\()/i, // Should we highlight user defined functions too?
  keyword:
    /\b(?:ACTION|ADD|AFTER|ALGORITHM|ALL|ALTER|ANALYZE|ANY|APPLY|AS|ASC|AUTHORIZATION|AUTO_INCREMENT|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADED?|CASE|CHAIN|CHAR(?:ACTER|SET)?|CHECK(?:POINT)?|CLOSE|CLUSTERED|COALESCE|COLLATE|COLUMNS?|COMMENT|COMMIT(?:TED)?|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS(?:TABLE)?|CONTINUE|CONVERT|CREATE|CROSS|CURRENT(?:_DATE|_TIME|_TIMESTAMP|_USER)?|CURSOR|CYCLE|DATA(?:BASES?)?|DATE(?:TIME)?|DAY|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DELIMITERS?|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DO|DOUBLE|DROP|DUMMY|DUMP(?:FILE)?|DUPLICATE|ELSE(?:IF)?|ENABLE|ENCLOSED|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPED?|EXCEPT|EXEC(?:UTE)?|EXISTS|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR(?: EACH ROW)?|FORCE|FOREIGN|FREETEXT(?:TABLE)?|FROM|FULL|FUNCTION|GEOMETRY(?:COLLECTION)?|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|HOUR|IDENTITY(?:COL|_INSERT)?|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTERVAL|INTO|INVOKER|ISOLATION|ITERATE|JOIN|KEYS?|KILL|LANGUAGE|LAST|LEAVE|LEFT|LEVEL|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONG(?:BLOB|TEXT)|LOOP|MATCH(?:ED)?|MEDIUM(?:BLOB|INT|TEXT)|MERGE|MIDDLEINT|MINUTE|MODE|MODIFIES|MODIFY|MONTH|MULTI(?:LINESTRING|POINT|POLYGON)|NATIONAL|NATURAL|NCHAR|NEXT|NO|NONCLUSTERED|NULLIF|NUMERIC|OFF?|OFFSETS?|ON|OPEN(?:DATASOURCE|QUERY|ROWSET)?|OPTIMIZE|OPTION(?:ALLY)?|ORDER|OUT(?:ER|FILE)?|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREPARE|PREV|PRIMARY|PRINT|PRIVILEGES|PROC(?:EDURE)?|PUBLIC|PURGE|QUICK|RAISERROR|READS?|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEAT(?:ABLE)?|REPLACE|REPLICATION|REQUIRE|RESIGNAL|RESTORE|RESTRICT|RETURN(?:ING|S)?|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROW(?:COUNT|GUIDCOL|S)?|RTREE|RULE|SAVE(?:POINT)?|SCHEMA|SECOND|SELECT|SERIAL(?:IZABLE)?|SESSION(?:_USER)?|SET(?:USER)?|SHARE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|SQL|START(?:ING)?|STATISTICS|STATUS|STRIPED|SYSTEM_USER|TABLES?|TABLESPACE|TEMP(?:ORARY|TABLE)?|TERMINATED|TEXT(?:SIZE)?|THEN|TIME(?:STAMP)?|TINY(?:BLOB|INT|TEXT)|TOP?|TRAN(?:SACTIONS?)?|TRIGGER|TRUNCATE|TSEQUAL|TYPES?|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNIQUE|UNLOCK|UNPIVOT|UNSIGNED|UPDATE(?:TEXT)?|USAGE|USE|USER|USING|VALUES?|VAR(?:BINARY|CHAR|CHARACTER|YING)|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH(?: ROLLUP|IN)?|WORK|WRITE(?:TEXT)?|YEAR)\b/i,
  boolean: /\b(?:FALSE|NULL|TRUE)\b/i,
  number: /\b0x[\da-f]+\b|\b\d+(?:\.\d*)?|\B\.\d+\b/i,
  operator:
    /[-+*\/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?|\b(?:AND|BETWEEN|DIV|ILIKE|IN|IS|LIKE|NOT|OR|REGEXP|RLIKE|SOUNDS LIKE|XOR)\b/i,
  punctuation: /[;[\]()`,.]/,
};

(function (Prism) {
  Prism.languages.diff = {
    coord: [
      // Match all kinds of coord lines (prefixed by "+++", "---" or "***").
      /^(?:\*{3}|-{3}|\+{3}).*$/m,
      // Match "@@ ... @@" coord lines in unified diff.
      /^@@.*@@$/m,
      // Match coord lines in normal diff (starts with a number).
      /^\d.*$/m,
    ],

    // deleted, inserted, unchanged, diff
  };

  /**
   * A map from the name of a block to its line prefix.
   *
   * @type {Object<string, string>}
   */
  var PREFIXES = {
    'deleted-sign': '-',
    'deleted-arrow': '<',
    'inserted-sign': '+',
    'inserted-arrow': '>',
    unchanged: ' ',
    diff: '!',
  };

  // add a token for each prefix
  Object.keys(PREFIXES).forEach(function (name) {
    var prefix = PREFIXES[name];

    var alias = [];
    if (!/^\w+$/.test(name)) {
      // "deleted-sign" -> "deleted"
      alias.push(/\w+/.exec(name)[0]);
    }
    if (name === 'diff') {
      alias.push('bold');
    }

    Prism.languages.diff[name] = {
      pattern: RegExp('^(?:[' + prefix + '].*(?:\r\n?|\n|(?![\\s\\S])))+', 'm'),
      alias: alias,
      inside: {
        line: {
          pattern: /(.)(?=[\s\S]).*(?:\r\n?|\n)?/,
          lookbehind: true,
        },
        prefix: {
          pattern: /[\s\S]/,
          alias: /\w+/.exec(name)[0],
        },
      },
    };
  });

  // make prefixes available to Diff plugin
  Object.defineProperty(Prism.languages.diff, 'PREFIXES', {
    value: PREFIXES,
  });
})(RendererPrism);

(function (Prism) {
  if (typeof Prism === 'undefined') {
    return;
  }

  var LANGUAGE_REGEX = /^diff-([\w-]+)/i;
  var HTML_TAG =
    /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/g;
  //this will match a line plus the line break while ignoring the line breaks HTML tags may contain.
  var HTML_LINE = RegExp(
    /(?:__|[^\r\n<])*(?:\r\n?|\n|(?:__|[^\r\n<])(?![^\r\n]))/.source.replace(
      /__/g,
      function () {
        return HTML_TAG.source;
      },
    ),
    'gi',
  );

  var warningLogged = false;

  Prism.hooks.add('before-sanity-check', function (env) {
    var lang = env.language;
    if (LANGUAGE_REGEX.test(lang) && !env.grammar) {
      env.grammar = Prism.languages[lang] = Prism.languages.diff;
    }
  });
  Prism.hooks.add('before-tokenize', function (env) {
    if (!warningLogged && !Prism.languages.diff && !Prism.plugins.autoloader) {
      warningLogged = true;
      console.warn(
        "Prism's Diff Highlight plugin requires the Diff language definition (prism-diff.js)." +
          "Make sure the language definition is loaded or use Prism's Autoloader plugin.",
      );
    }

    var lang = env.language;
    if (LANGUAGE_REGEX.test(lang) && !Prism.languages[lang]) {
      Prism.languages[lang] = Prism.languages.diff;
    }

    // Always ensure diff-* languages use the diff grammar for tokenization
    if (LANGUAGE_REGEX.test(lang)) {
      env.grammar = Prism.languages.diff;
    }
  });

  /**
   * The original diff-highlight plugin relies on the `wrap` hook which is
   * executed during `Token.stringify()`. `prism-react-renderer`, however,
   * never calls `Token.stringify()` – it works directly with Prism tokens.
   * This means the original plugin is effectively a no-op and nested
   * highlighting inside diff blocks (e.g. `diff-sql`) is lost.
   *
   * To make the plugin compatible with prism-react-renderer we re-implement
   * the essential logic inside an `after-tokenize` hook. The algorithm
   * iterates over all tokens, detects diff line tokens ("inserted-sign",
   * "deleted-sign", …) and replaces their textual content with a
   * token sequence consisting of:
   *    1. a `prefix` token (so "+" or "-" can still be styled)
   *    2. the result of tokenising the rest of the line using the proper
   *       grammar (sql, js, …)
   *
   * The end result is *pure tokens*, so prism-react-renderer can render
   * them just like any other language.
   */

  Prism.hooks.add('after-tokenize', function (env) {
    var langMatch = LANGUAGE_REGEX.exec(env.language || '');
    var isGenericDiff = env.language === 'diff';

    if (!isGenericDiff && !langMatch) {
      return; // not a diff language – skip
    }

    var diffLanguage = isGenericDiff ? null : langMatch[1];
    var diffGrammar = diffLanguage ? Prism.languages[diffLanguage] : null;
    if (!diffGrammar && diffLanguage === 'js') {
      diffGrammar = Prism.languages['javascript'];
    }

    var PREFIXES = Prism.languages.diff && Prism.languages.diff.PREFIXES;
    if (!PREFIXES) return;

    /**
     * Recursively walk all tokens. Whenever we encounter a token of type
     * `line` (those are produced by the built-in diff grammar for the
     * part **after** the +/-/!/␠ prefix) we re-tokenise its text with the
     * real language grammar (sql, js, …) and replace the string with the
     * resulting token array.  This keeps the original diff token tree –
     * including the `prefix` sub-token – intact while adding proper
     * syntax colours to the remainder of the line.
     */
    function enhance(tokens) {
      for (var i = 0; i < tokens.length; i++) {
        var t = tokens[i];

        if (typeof t === 'string') continue;

        if (Array.isArray(t.content)) {
          enhance(t.content);
        } else if (t.type === 'line' && typeof t.content === 'string') {
          if (diffGrammar) {
            t.content = Prism.tokenize(t.content, diffGrammar);
          }
        }
      }
    }

    enhance(env.tokens);
  });
})(RendererPrism);

// Extend YAML to support SQL syntax highlighting in sql: fields
(function (Prism) {
  if (Prism.languages.yaml && Prism.languages.sql) {
    // Insert SQL patterns before existing YAML patterns for higher priority
    Prism.languages.insertBefore('yaml', 'key', {
      'sql-inline': {
        pattern: /((?:^|\n)\s*sql\s*:\s*)([^\n\r|>]+)/,
        lookbehind: true,
        inside: Prism.languages.sql,
      },
    });

    // Handle multiline SQL blocks with proper indentation
    Prism.languages.insertBefore('yaml', 'key', {
      'sql-multiline': {
        pattern:
          /((?:^|\n)\s*sql\s*:\s*[|>][-+]?\s*\n)((?:\s{2,}[^\n\r]+(?:\n|$))+)/,
        lookbehind: true,
        inside: {
          'sql-content': {
            pattern: /^(\s+)(.+)/gm,
            inside: {
              indent: /^\s+/,
              'sql-code': {
                pattern: /.+/,
                inside: Prism.languages.sql,
              },
            },
          },
        },
      },
    });

    // Handle YAML scalar content that follows sql: > or sql: | indicators
    Prism.languages.insertBefore('yaml', 'scalar', {
      'sql-scalar': {
        pattern:
          /^\s*(SELECT|INSERT|UPDATE|DELETE|WITH|CREATE|DROP|ALTER|UNION|FROM|WHERE|JOIN|GROUP|ORDER|HAVING)[\s\S]*$/im,
        inside: Prism.languages.sql,
      },
    });
  }
})(RendererPrism);

export { RendererPrism as Prism };

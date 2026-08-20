import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  Styles,
  tasty,
} from '@tenphi/tasty';
import { Highlight } from 'prism-react-renderer';
import { forwardRef } from 'react';

import { ensureYamlSqlExtensions, Prism } from './prismSetup';

import 'prismjs/components/prism-markup.js';
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-yaml.js';
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-sql.js';

const PreElement = tasty({
  as: 'pre',
  qa: 'CodeBlock',
  styleProps: CONTAINER_STYLES.concat([]),
  className: 'cube-prism-code',
  styles: {
    margin: 0,
    padding: 0,
    overflow: 'auto',
    scrollbar: 'styled',
    preset: 's3',

    Code: {
      display: 'block',
      preset: 's3',
      // The global Prism CSS pins `white-space: pre` on
      // `code[class*="language-"]`, so the wrap has to be re-declared right on
      // the `<code>` element — `pre-wrap` on the surrounding block alone does
      // not cascade past it. `overflow-wrap: anywhere` also breaks runs with no
      // spaces (URLs, tokens, identifiers) that `pre-wrap` on its own would let
      // overflow.
      whiteSpace: {
        '': 'pre',
        wrapped: 'pre-wrap',
      },
      overflowWrap: {
        '': 'normal',
        wrapped: 'anywhere',
      },
    },
  },
});

export interface CubePrismCodeProps extends ContainerStyleProps {
  /** The CSS style map */
  style?: BaseProps['style'];
  styles?: Styles;
  /**
   * Soft-wrap long lines onto multiple lines instead of scrolling them
   * horizontally. Unbreakable runs like URLs, tokens and identifiers wrap too.
   * Useful for error messages and logs.
   */
  isWrapped?: boolean;
  /** The code snippet */
  code?: string;
  /** The language of the code snippet */
  language?:
    | 'javascript'
    | 'css'
    | 'sql'
    | 'less'
    | 'html'
    | 'json'
    | 'yaml'
    | 'bash'
    | 'editorconfig'
    | 'php'
    | 'python'
    | 'typescript';
}

function isDiffCode(code: string): boolean {
  // Split the code into lines
  const lines = code.split('\n');

  // Define patterns to check for diff characteristics
  const additionPattern = /^\+/; // Lines starting with '+'
  const deletionPattern = /^-+/; // Lines starting with '-'
  const headerPattern = /^(diff --git|---|\+\+\+)/; // Diff headers

  // Check each line for diff-specific patterns
  for (const line of lines) {
    if (
      additionPattern.test(line) ||
      deletionPattern.test(line) ||
      headerPattern.test(line)
    ) {
      return true; // Code matches a diff pattern
    }
  }

  // No diff-specific patterns found
  return false;
}

function PrismCode(props: CubePrismCodeProps, ref) {
  let { code = '', language = 'javascript', isWrapped, ...otherProps } = props;

  if (!code) {
    code = '';
  }

  if (typeof code !== 'string' && code) {
    throw new Error(
      'UIKit: code prop should be a string in PrismCode. Found: ' + typeof code,
    );
  }

  const isDiff = isDiffCode(code || '');

  const grammarLang = isDiff ? `diff-${language}` : language;

  // Ensure the diff language exists before rendering
  if (isDiff && !Prism.languages[grammarLang]) {
    Prism.languages[grammarLang] = Prism.languages.diff;
  }

  // Ensure YAML SQL extensions are applied for YAML content
  if (language === 'yaml' || grammarLang === 'diff-yaml') {
    ensureYamlSqlExtensions();
  }

  return (
    <PreElement ref={ref} {...otherProps} mods={{ wrapped: isWrapped }}>
      <Highlight prism={Prism} code={code} language={grammarLang as any}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => {
          return (
            <code
              data-element="Code"
              className={`${className}${isDiff ? ' diff-highlight' : ''}`}
              style={{
                ...style,
                color: undefined,
                backgroundColor: undefined,
              }}
            >
              {tokens.map((line, i) => {
                const { key: _lineKey, ...lineProps } = getLineProps({
                  line,
                  key: i,
                });

                return (
                  <span
                    key={i}
                    {...lineProps}
                    style={{
                      ...lineProps.style,
                      color: undefined,
                    }}
                  >
                    {line.map((token, key) => {
                      const { key: _tokenKey, ...tokenProps } = getTokenProps({
                        token,
                        key,
                      });

                      return (
                        <span
                          key={key}
                          {...tokenProps}
                          style={{
                            ...tokenProps.style,
                            color: undefined,
                            backgroundColor: undefined,
                          }}
                        />
                      );
                    })}
                    {'\n'}
                  </span>
                );
              })}
            </code>
          );
        }}
      </Highlight>
    </PreElement>
  );
}

/**
 * Code block with syntax highlighting
 */
const _PrismCode = forwardRef(PrismCode);

_PrismCode.displayName = 'PrismCode';

export { _PrismCode as PrismCode };

// prism-react-renderer
import { Highlight, Prism as RendererPrism } from 'prism-react-renderer';
import { forwardRef } from 'react';

import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  Styles,
  tasty,
} from '../../../tasty';

// Bridge the Prism instance used by `prism-react-renderer` **before** we load
// any additional grammars so that those grammars augment this exact object.
(globalThis as any).Prism = RendererPrism;

import('prismjs/components/prism-diff');
import('prismjs/components/prism-sql');
import('prismjs/plugins/diff-highlight/prism-diff-highlight');
// already bundled in most cases, but kept for completeness
import('prismjs/components/prism-javascript');
import('prismjs/components/prism-yaml');

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

    Code: {
      display: 'block',
    },
  },
});

function isDiffCode(code: string): boolean {
  // Split the code into lines
  const lines = code.split('\n');

  // Define patterns to check for diff characteristics
  const additionPattern = /^\+/; // Lines starting with '+'
  const deletionPattern = /^-/; // Lines starting with '-'
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

export interface CubePrismCodeProps extends ContainerStyleProps {
  /** The CSS style map */
  style?: BaseProps['style'];
  styles?: Styles;
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

function PrismCode(props: CubePrismCodeProps, ref) {
  const { code = '', language = 'javascript', ...otherProps } = props;

  if (typeof code !== 'string' && code) {
    throw new Error(
      'UIKit: code prop should be a string in PrismCode. Found: ' + typeof code,
    );
  }

  const isDiff = isDiffCode(code || '');

  // For diff snippets we rely on the `diff` grammar. We still keep the
  // original language as a suffix (e.g. diff-javascript) so that the diff
  // plugin can colour the inserted / deleted signs while the inner tokens are
  // still highlighted correctly.
  const grammarLang = isDiff ? `diff-${language}` : language;

  return (
    <PreElement ref={ref} {...otherProps}>
      <Highlight
        prism={RendererPrism}
        code={code}
        language={grammarLang as any}
      >
        {({ className, tokens, getLineProps, getTokenProps }) => (
          <code
            data-element="Code"
            className={`${className}${isDiff ? ' diff-highlight' : ''}`}
          >
            {tokens.map((line, i) => (
              <span
                key={i}
                {...getLineProps({ line, key: i })}
                style={undefined}
              >
                {line.map((token, key) => {
                  const props = getTokenProps({ token, key });

                  return (
                    <span
                      key={key}
                      {...props}
                      style={{
                        ...props.style,
                        color: undefined,
                        backgroundColor: undefined,
                      }}
                    />
                  );
                })}
                {'\n'}
              </span>
            ))}
          </code>
        )}
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

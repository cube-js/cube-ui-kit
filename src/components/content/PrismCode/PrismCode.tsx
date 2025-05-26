import Prism from 'prismjs';
import { forwardRef, useEffect } from 'react';

import 'prismjs/components/prism-diff';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/plugins/diff-highlight/prism-diff-highlight';

import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  Styles,
  tasty,
} from '../../../tasty';

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
  let { code, language = 'javascript', ...otherProps } = props;

  if (typeof code !== 'string' && code) {
    throw new Error(
      'UIKit: code prop should be a string in PrismCode. Found: ' + typeof code,
    );
  }

  const isDiff = isDiffCode(code || '');

  useEffect(() => {
    Prism.highlightAll();
  });

  return (
    <PreElement ref={ref} {...otherProps}>
      <code
        data-element="Code"
        className={`language${isDiff ? '-diff' : ''}-${language}${isDiff ? ' diff-highlight' : ''}`}
      >
        {code}
      </code>
    </PreElement>
  );
}

/**
 * Code block with syntax highlighting
 */
const _PrismCode = forwardRef(PrismCode);

_PrismCode.displayName = 'PrismCode';

export { _PrismCode as PrismCode };

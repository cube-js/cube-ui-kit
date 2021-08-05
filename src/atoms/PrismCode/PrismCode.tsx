import { forwardRef, useEffect } from 'react';
import Prism from 'prismjs';
import { BaseProps } from '../../components/types';

export interface CubePrismCodeProps {
  /** The CSS style map */
  style?: BaseProps['style'];
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

function PrismCode(props: CubePrismCodeProps) {
  let { style, code, language = 'javascript' } = props;

  useEffect(() => {
    Prism.highlightAll();
  });

  return (
    <pre className="cube-prism-code" style={style}>
      <code className={`language-${language}`}>{code}</code>
    </pre>
  );
}

/**
 * Code block with syntax highlighting
 */
const _PrismCode = forwardRef(PrismCode);
export { _PrismCode as PrismCode };

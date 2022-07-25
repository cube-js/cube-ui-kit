import { forwardRef, useEffect } from 'react';
import Prism from 'prismjs';
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

    Code: {
      display: 'block',
    },
  },
});

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

  useEffect(() => {
    Prism.highlightAll();
  });

  return (
    <PreElement ref={ref} className="cube-prism-code" {...otherProps}>
      <code data-element="Code" className={`language-${language}`}>
        {code}
      </code>
    </PreElement>
  );
}

/**
 * Code block with syntax highlighting
 */
const _PrismCode = forwardRef(PrismCode);
export { _PrismCode as PrismCode };

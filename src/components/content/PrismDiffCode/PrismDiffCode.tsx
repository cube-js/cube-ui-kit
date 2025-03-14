import { diffLines } from 'diff';

import { BaseProps, Styles } from '../../../tasty/index';
import { PrismCode } from '../PrismCode/PrismCode';

export interface CubePrismDiffCodeProps {
  style?: BaseProps['style'];
  styles?: Styles;
  /** Original code string */
  original: string;
  /** Modified code string */
  modified: string;
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

export function PrismDiffCode({
  original,
  modified,
  ...props
}: CubePrismDiffCodeProps) {
  // Generate the diff string
  const diff = diffLines(original, modified);

  const diffString = diff
    .map((part) => {
      const value = part.value.trimEnd();

      if (part.added) {
        return value
          .split('\n')
          .map((val) => {
            return val ? `+${val}` : '';
          })
          .join('\n');
      }

      if (part.removed) {
        return value
          .split('\n')
          .map((val) => {
            return val ? `-${val}` : '';
          })
          .join('\n');
      }

      return value
        .split('\n')
        .map((val) => {
          return val ? ` ${val}` : '';
        })
        .join('\n');
    })
    .join('\n');

  return <PrismCode code={diffString} {...props} />;
}

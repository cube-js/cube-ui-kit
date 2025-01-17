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
  const diff = diffLines(original, modified, { newlineIsToken: true });
  const diffString = diff
    .map((part) => {
      if (part.added) {
        return `+${part.value.trimEnd()}`;
      }
      if (part.removed) {
        return `-${part.value.trimEnd()}`;
      }
      return ` ${part.value.trimEnd()}`;
    })
    .join('\n');

  return <PrismCode code={diffString} {...props} />;
}

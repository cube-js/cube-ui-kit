import { Styles } from '../styles/types';
import { isSelector } from '../stringify/renderStyles';

export function mergeStyles(...objects: Styles[]) {
  let styles = objects[0];
  let pos = 1;

  while (pos in objects) {
    const keys = Object.keys(styles);
    const newStyles = objects[pos];

    const resultStyles = Object.assign({}, styles, newStyles);

    for (let key of keys) {
      if (isSelector(key)) {
        resultStyles[key] = Object.assign({}, styles[key], newStyles[key]);
      }
    }

    styles = resultStyles;

    pos++;
  }

  return styles;
}

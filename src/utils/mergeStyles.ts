import { Styles, StylesWithoutSelectors } from '../styles/types';
import { isSelector } from './renderStyles';

export function mergeStyles(...objects: (Styles | undefined | null)[]): Styles {
  let styles = objects[0] || {};
  let pos = 1;

  while (pos in objects) {
    const keys = styles ? Object.keys(styles) : [];
    const newStyles = objects[pos];

    const resultStyles = { ...styles, ...newStyles };

    for (let key of keys) {
      if (isSelector(key)) {
        resultStyles[key] = {
          ...(styles?.[key] ? (styles[key] as StylesWithoutSelectors) : null),
          ...(newStyles?.[key] ? (newStyles[key] as StylesWithoutSelectors) : null),
        };
      }
    }

    styles = resultStyles;

    pos++;
  }

  return styles;
}

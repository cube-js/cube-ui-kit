import { isSelector } from '../pipeline';
import { Styles, StylesWithoutSelectors } from '../styles/types';

export function mergeStyles(...objects: (Styles | undefined | null)[]): Styles {
  let styles: Styles = objects[0] ? { ...objects[0] } : {};
  let pos = 1;

  while (pos in objects) {
    const selectorKeys = Object.keys(styles).filter(
      (key) => isSelector(key) && styles[key],
    );
    const newStyles = objects[pos];

    if (newStyles) {
      const resultStyles = { ...styles, ...newStyles };

      for (let key of selectorKeys) {
        if (newStyles?.[key] === false) {
          // Remove sub-element styles when explicitly set to false
          delete resultStyles[key];
        } else if (newStyles?.[key] == null) {
          // Nullish values (null/undefined) are ignored - restore original styles
          resultStyles[key] = styles[key];
        } else if (newStyles?.[key]) {
          resultStyles[key] = {
            ...(styles[key] as StylesWithoutSelectors),
            ...(newStyles[key] as StylesWithoutSelectors),
          };
        }
      }

      styles = resultStyles;
    }

    pos++;
  }

  return styles;
}

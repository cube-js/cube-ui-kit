/**
 * Generate data DOM attributes from modifier map.
 */
import { AllBaseProps } from '../types';

export function modAttrs(
  map: AllBaseProps['mods'],
): Record<string, string> | null {
  return map
    ? Object.keys(map).reduce((attrs, key) => {
        if (map[key]) {
          attrs[`data-is-${key}`] = '';
        }

        return attrs;
      }, {})
    : null;
}

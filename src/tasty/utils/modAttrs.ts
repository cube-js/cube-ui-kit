/**
 * Generate data DOM attributes from modifier map.
 */
import { AllBaseProps } from '../types';

import { cacheWrapper } from './cache-wrapper';
import { camelToKebab } from './case-converter';

function modAttrs(map: AllBaseProps['mods']): Record<string, string> | null {
  return map
    ? Object.keys(map).reduce((attrs, key) => {
        if (map[key]) {
          attrs[`data-is-${camelToKebab(key)}`] = '';
        }

        return attrs;
      }, {})
    : null;
}

const _modAttrs = cacheWrapper(modAttrs);

export { _modAttrs as modAttrs };

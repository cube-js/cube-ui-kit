/**
 * Generate data DOM attributes from modifier map.
 */
import { AllBaseProps } from '../types';

import { cacheWrapper } from './cache-wrapper';
import { camelToKebab } from './case-converter';

function modAttrs(map: AllBaseProps['mods']): Record<string, string> | null {
  return map
    ? Object.keys(map).reduce((attrs, key) => {
        const value = map[key];

        // Skip null, undefined, false
        if (value == null || value === false) {
          return attrs;
        }

        const attrName = `data-${camelToKebab(key)}`;

        if (value === true) {
          // Boolean true: data-{name}=""
          attrs[attrName] = '';
        } else if (typeof value === 'string') {
          // String value: data-{name}="value"
          attrs[attrName] = value;
        } else if (typeof value === 'number') {
          // Number: convert to string
          attrs[attrName] = String(value);
        } else {
          // Reject other types (objects, arrays, functions)
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              `CubeUIKit: Invalid mod value for "${key}". Expected boolean, string, or number, got ${typeof value}`,
            );
          }
        }

        return attrs;
      }, {})
    : null;
}

const _modAttrs = cacheWrapper(modAttrs);

export { _modAttrs as modAttrs };

/**
 * Generate data DOM attributes from modifier map.
 * @param {Object<string,boolean>} map
 * @return {Object<string,string>}
 */
export function modAttrs(map) {
  return Object.keys(map).reduce((attrs, key) => {
    if (map[key]) {
      attrs[`data-is-${key}`] = '';
    }

    return attrs;
  }, {});
}

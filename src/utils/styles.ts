import type { Styles } from '@tenphi/tasty';

/**
 * Split properties into style and non-style properties.
 * Collects style-related props from `props` (based on `styleList`)
 * and merges them with `defaultStyles` and `props.styles`.
 *
 * @param props - Component prop map.
 * @param styleList - List of style property names to extract.
 * @param defaultStyles - Default style map of the component.
 * @param propMap - Props-to-style alias map (e.g. `{ bg: 'fill' }`).
 * @param ignoreList - Properties to skip during extraction.
 */
export function extractStyles(
  props: Record<string, unknown>,
  styleList: readonly string[] = [],
  defaultStyles?: Styles,
  propMap?: Record<string, string>,
  ignoreList: readonly string[] = [],
): Styles {
  const ignoreSet = new Set(ignoreList);
  const styleSet = new Set(styleList);

  const styles: Styles = {
    ...defaultStyles,
    ...(!ignoreSet.has('styles') &&
    props.styles &&
    typeof props.styles === 'object'
      ? (props.styles as Styles)
      : undefined),
  };

  for (const prop of Object.keys(props)) {
    if (ignoreSet.has(prop)) continue;

    const styleName = propMap?.[prop] ?? prop;

    if (styleSet.has(styleName)) {
      styles[styleName] = props[prop] as Styles[keyof Styles];
    }
  }

  return styles;
}

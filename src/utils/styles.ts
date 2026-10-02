import { isSelector, mergeStyles } from '@tenphi/tasty';

import type { Styles } from '@tenphi/tasty';

type StyleLayer = Styles | null | undefined;
type StyleRecord = Record<string, unknown>;

function isRecord(value: unknown): value is StyleRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/**
 * The keys whose last explicit value across `layers` is a reset: `null`, or
 * `false` too where `allowFalse` (a sub-element key, which tasty drops for
 * either).
 */
function finalResets(layers: StyleRecord[], allowFalse: boolean) {
  const last = new Map<string, unknown>();

  for (const layer of layers) {
    for (const key of Object.keys(layer)) {
      if (layer[key] !== undefined) last.set(key, layer[key]);
    }
  }

  return [...last].filter(
    ([key, value]) =>
      value === null || (value === false && allowFalse && isSelector(key)),
  );
}

/**
 * Merge runtime style layers with tasty's `mergeStyles`, later layers winning.
 * This is the algorithm tasty applies between an element's own styles and its
 * `styles` prop: a state map without a `''` key extends the one below it,
 * sub-elements merge key by key, and `undefined` keeps the lower value.
 *
 * Resets are the one difference. The result is not final: it is passed on as
 * some element's `styles`, which tasty merges over that element's own styles
 * once more. `mergeStyles` applies a `null` by deleting the key, so a consumer's
 * `{ padding: null }` would vanish here, before it reached the element whose
 * padding it was meant to remove. Every reset that is the last word on its key,
 * top-level or inside a sub-element, is therefore written back into the result.
 */
export function mergeStyleLayers(...layers: StyleLayer[]): Styles {
  const present = layers.filter(isRecord) as StyleRecord[];
  const merged = mergeStyles(...(present as Styles[])) as StyleRecord;

  for (const [key, value] of finalResets(present, true)) merged[key] = value;

  for (const key of Object.keys(merged)) {
    if (!isSelector(key) || !isRecord(merged[key])) continue;

    // The sub-element's layers since its last wholesale reset.
    let subLayers: StyleRecord[] = [];

    for (const layer of present) {
      const sub = layer[key];

      if (sub === null || sub === false) subLayers = [];
      else if (isRecord(sub)) subLayers.push(sub);
    }

    const resets = finalResets(subLayers, false);

    // Copied first: a sub-element present in one layer is that layer's object.
    if (resets.length)
      merged[key] = { ...merged[key], ...Object.fromEntries(resets) };
  }

  return merged as Styles;
}

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
  props: object,
  styleList: readonly string[] = [],
  defaultStyles?: Styles,
  propMap?: Record<string, string>,
  ignoreList: readonly string[] = [],
): Styles {
  const ignoreSet = new Set(ignoreList);
  const styleSet = new Set(styleList);
  const record = props as Record<string, unknown>;

  // `props.styles` over the component defaults. The result is always a fresh
  // object, so the style props below can be assigned onto it.
  const styles = mergeStyleLayers(
    defaultStyles,
    !ignoreSet.has('styles') &&
      record.styles &&
      typeof record.styles === 'object'
      ? (record.styles as Styles)
      : undefined,
  );

  for (const prop of Object.keys(record)) {
    if (ignoreSet.has(prop)) continue;

    const styleName = propMap?.[prop] ?? prop;

    if (styleSet.has(styleName)) {
      styles[styleName] = record[prop] as Styles[keyof Styles];
    }
  }

  return styles;
}

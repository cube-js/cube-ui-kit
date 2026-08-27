import { hashString } from '../../../tokens/color-theme';
import { getPaletteConfig } from '../../../tokens/palette-config';

import type { Styles } from '@tenphi/tasty';
import type { ColorThemeConfig } from '../../../tokens/color-theme';
import type {
  CubeResolvedColumn,
  CubeTableColumnColor,
  CubeTableColumnColorScope,
  CubeTableColumnTheme,
} from './types';

const THEMES = new Set<string>([
  'primary',
  'purple',
  'success',
  'danger',
  'warning',
  'note',
]);

const DEFAULT_SCOPE: readonly CubeTableColumnColorScope[] = [
  'header',
  'body',
  'totals',
];

/** The three paint values a tinted cell needs, as tasty colour strings. */
interface TintPaint {
  fill: string;
  fillBand: string;
  text: string;
  /** The header's text — muted, to match an untinted header. */
  headerText: string;
}

export interface ColumnTints {
  /** `columnKey` → `data-tint` value. Absent means the column is not tinted. */
  slots: Map<string, string>;
  /** Which scopes each column's tint applies to. */
  scopes: Map<string, readonly CubeTableColumnColorScope[]>;
  /**
   * Theme configs to register with `useColorTheme`, one per distinct derived
   * spec. Empty when every column used the `{ fill, text }` escape hatch.
   */
  configs: ColorThemeConfig[];
  /** Merge into `styles.Cell`. */
  cellStyles: Styles | null;
  /** Merge into `styles.HeaderCell`. */
  headerCellStyles: Styles | null;
}

const EMPTY: ColumnTints = {
  slots: new Map(),
  scopes: new Map(),
  configs: [],
  cellStyles: null,
  headerCellStyles: null,
};

/**
 * A theme name is only a theme name when the palette has one — otherwise the
 * string is a colour. `'note'` is a theme; `'#0ea5e9'` and `'red'` are colours.
 */
function isThemeName(value: string): value is CubeTableColumnTheme {
  return THEMES.has(value);
}

/**
 * The seed for a palette theme, read from the live palette config so a re-seeded
 * `success` hue moves the columns tinted with it.
 *
 * `primary` and `purple` are the brand itself, which is why they read `hue`
 * rather than a `themes` entry — the palette derives them from the brand hue too.
 *
 * A status theme seeded by a COLOR needs nothing special here: its resolved seed already
 * carries that color's hue and chroma, so a tinted column follows it for free. Only the
 * two numbers are passed on — a runtime tint re-derives its own lightness per scheme, so
 * the seed's `color` and `colorTone` have nothing to say to it and are not part of
 * `ColorThemeConfig`.
 */
function themeSeed(theme: CubeTableColumnTheme): {
  hue: number;
  saturation: number;
} {
  const config = getPaletteConfig();

  if (theme === 'primary' || theme === 'purple') {
    return { hue: config.hue, saturation: config.saturation };
  }

  const { hue, saturation } = config.themes[theme];

  return { hue, saturation };
}

/** Normalizes any spec into a theme config, or `null` for the manual form. */
export function tintConfig(
  color: CubeTableColumnColor,
): ColorThemeConfig | null {
  if (typeof color === 'string') {
    return isThemeName(color) ? themeSeed(color) : { hue: color };
  }

  if ('fill' in color) return null;

  return { hue: color.hue, saturation: color.saturation };
}

/**
 * A stable identity for a spec, so two columns asking for the same colour share
 * one slot — and therefore one set of generated rules.
 *
 * For a derived spec that identity is the theme's own content hash, which makes it
 * shared across TABLES as well: the tokens are registered globally under the same
 * name. The manual form has no theme, so it is keyed on its literal values.
 */
function manualKey(paint: TintPaint): string {
  // Hashed, not literal: the values contain `#`, `.` and `|`, none of which
  // survive being interpolated into a tasty `@own(tint=…)` state key.
  return `raw-${hashString(
    `${paint.fill}|${paint.fillBand}|${paint.text}|${paint.headerText}`,
  )}`;
}

export interface BuildColumnTintsOptions {
  /**
   * Resolves a derived spec to its theme. Injected rather than imported so the
   * caller — which is a component and can run hooks — owns registration, and so
   * this stays a pure function.
   */
  resolveTheme: (config: ColorThemeConfig) => {
    name: string;
    colors: Record<string, string>;
  };
}

/**
 * Maps a table's columns onto tint slots and the style maps that paint them.
 *
 * Pure. The colour maths lives in `src/tokens/color-theme.ts`; this is only the
 * mapping from columns to `data-tint` values and tasty state maps.
 */
export function buildColumnTints<T>(
  columns: readonly CubeResolvedColumn<T>[],
  { resolveTheme }: BuildColumnTintsOptions,
): ColumnTints {
  const tinted = columns.filter(
    (column) => !column.isStructural && column.color != null,
  );

  if (!tinted.length) return EMPTY;

  const slots = new Map<string, string>();
  const scopes = new Map<string, readonly CubeTableColumnColorScope[]>();
  const configs: ColorThemeConfig[] = [];
  const paints = new Map<string, TintPaint>();

  for (const column of tinted) {
    const color = column.color as CubeTableColumnColor;
    const config = tintConfig(color);
    let slot: string;
    let paint: TintPaint;

    if (config) {
      const theme = resolveTheme(config);

      slot = theme.name;
      paint = {
        fill: theme.colors.surface,
        fillBand: theme.colors['surface-2'],
        text: theme.colors['surface-2-text'],
        headerText: theme.colors['surface-2-text-soft'],
      };

      if (!paints.has(slot)) configs.push(config);
    } else {
      const manual = color as {
        fill: string;
        fillBand?: string;
        text?: string;
      };

      paint = {
        fill: manual.fill,
        // Without a band the column simply does not band — the caller asked for
        // exactly these values, so inventing a second one would be a surprise.
        fillBand: manual.fillBand ?? manual.fill,
        text: manual.text ?? '#row-text',
        // The manual form derives nothing, so the header takes the same text.
        headerText: manual.text ?? '#row-text',
      };
      slot = manualKey(paint);
    }

    slots.set(column.key, slot);
    scopes.set(column.key, column.colorScope ?? DEFAULT_SCOPE);
    paints.set(slot, paint);
  }

  return {
    slots,
    scopes,
    configs,
    cellStyles: cellTintStyles(paints),
    headerCellStyles: headerTintStyles(paints),
  };
}

/**
 * `#cell-base` / `#cell-text` for the body.
 *
 * The band and the pinned-total fill share ONE grouped key rather than two
 * entries with the same value: tasty coalesces entries in a state map that
 * serialize identically, promotes them to the group's maximum priority and
 * negates them against everything below — which would silently turn the plain
 * tint branch into `false`. See `src/components/data/AGENTS.md`.
 */
function cellTintStyles(paints: Map<string, TintPaint>): Styles {
  const base: Record<string, string> = { '': '#row-base' };
  const text: Record<string, string> = { '': '#row-text' };

  for (const [slot, paint] of paints) {
    base[`@own(tint=${slot})`] = paint.fill;
    // Only worth a rule when it differs; an identical value here is exactly what
    // the coalescing trap eats.
    if (paint.fillBand !== paint.fill) {
      base[`@own(tint=${slot}) & (@own(odd) | @own(pinned))`] = paint.fillBand;
    }
    text[`@own(tint=${slot})`] = paint.text;
  }

  return { '#cell-base': base, '#cell-text': text };
}

/**
 * The header takes the deeper band unconditionally, mirroring how the neutral
 * header sits on `#surface-2` rather than `#surface`.
 */
function headerTintStyles(paints: Map<string, TintPaint>): Styles {
  const base: Record<string, string> = { '': '#row-base' };
  const text: Record<string, string> = { '': '#row-text' };

  for (const [slot, paint] of paints) {
    base[`@own(tint=${slot})`] = paint.fillBand;
    text[`@own(tint=${slot})`] = paint.headerText;
  }

  return { '#cell-base': base, '#cell-text': text };
}

/**
 * The `data-tint` value for one part of a column, or `undefined` when the column
 * is untinted or its scope excludes that part.
 */
export function tintSlot(
  tints: ColumnTints,
  columnKey: string,
  scope: CubeTableColumnColorScope,
): string | undefined {
  const slot = tints.slots.get(columnKey);

  if (slot == null) return undefined;

  return tints.scopes.get(columnKey)?.includes(scope) ? slot : undefined;
}

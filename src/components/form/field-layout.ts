import { DIMENSION_STYLES, POSITION_STYLES } from '@tenphi/tasty';

import { mergeProps } from '../../utils/react/index';
import { extractStyles, mergeStyleLayers } from '../../utils/styles';

import { rendersFieldChrome } from './wrapper';

import type {
  DimensionStyleProps,
  PositionStyleProps,
  Styles,
} from '@tenphi/tasty';
import type { Props } from '../../props';

/**
 * An input's style props. They place and size its outer element: the field
 * wrapper when it renders, the input itself otherwise.
 */
export interface FieldLayoutStyleProps
  extends PositionStyleProps, DimensionStyleProps {}

/** The names of `FieldLayoutStyleProps`. */
export const FIELD_LAYOUT_STYLES: readonly string[] = [
  ...POSITION_STYLES,
  ...DIMENSION_STYLES,
];

/**
 * Style props that size the wrapper across, so the input fills its width.
 * `inlineSize` counts as `width`, below.
 */
const FILL_WIDTH_STYLES = ['width', 'flexBasis', 'flexGrow', 'flex'];
/**
 * Style props that size the wrapper down, so the input fills its height.
 * `blockSize` counts as `height`, below.
 */
const FILL_HEIGHT_STYLES = ['height'];
const FLEX_STYLES = ['flexBasis', 'flexGrow', 'flex'];

/** Values that leave an element at its natural size. */
const NOT_SIZING = new Set<unknown>([0, '0', 'none', 'auto', 'initial']);

/** A value that sizes its element: set, and not a reset or a no-op. */
function isSizing(value: unknown) {
  return value != null && !NOT_SIZING.has(value);
}

/**
 * The wrapper's own `width` follows a logical size in the same CSS rule and
 * overrides it, so on the wrapper a logical size takes its physical name. A
 * physical one given as well, `null` included, wins.
 */
const PHYSICAL_SIZES = [
  ['inlineSize', 'width'],
  ['blockSize', 'height'],
] as const;

export interface FieldLayoutOptions {
  /**
   * Whether the input renders its field wrapper. Defaults to
   * `rendersFieldChrome(props)`, so pass the props `wrapWithField` receives. A
   * grouped option, which never wraps, passes `false`.
   */
  hasChrome?: boolean;
  /**
   * Whether flex props also fill the wrapper's height: set by the inputs whose
   * bare form grows with its flex line (lists, text areas). A single-line input
   * would only collect the spare height between itself and its message.
   */
  fillHeightOnFlex?: boolean;
  /** The input's own default styles, under `styles`. */
  defaultStyles?: Styles;
}

export interface FieldLayout {
  /** The input's styles: `styles`, plus the style props when it is bare. */
  styles: Styles;
  /**
   * Spread into the props of `wrapWithField`: the wrapper's `fieldStyles`,
   * with the style props over them, and its `fieldProps`, with the fill mods.
   */
  field: { fieldStyles?: Styles; fieldProps?: Props };
  /** Whether the style props size the wrapper across: the input fills it. */
  fillWidth: boolean;
  /** Whether the style props size the wrapper down: the input fills it. */
  fillHeight: boolean;
}

/**
 * Routes an input's style props to its outer element. Bare, they join the
 * input's `styles`. With the field chrome, they go to the wrapper over
 * `fieldStyles`, and a wrapper they size gets `fill-width` / `fill-height`,
 * under which `FieldWrapper` lets the input stretch as it would in a grid cell
 * of that size. `styles` always stays on the input.
 */
export function splitFieldLayout(
  props: object,
  options: FieldLayoutOptions = {},
): FieldLayout {
  const {
    hasChrome = rendersFieldChrome(props),
    fillHeightOnFlex = false,
    defaultStyles,
  } = options;
  const record = props as Record<string, unknown> & {
    styles?: Styles;
    fieldStyles?: Styles;
    fieldProps?: Props;
  };

  if (!hasChrome) {
    return {
      styles: extractStyles(props, FIELD_LAYOUT_STYLES, defaultStyles),
      field: {},
      fillWidth: false,
      fillHeight: false,
    };
  }

  const styles = mergeStyleLayers(defaultStyles, record.styles);
  const layoutStyles = extractStyles(
    props,
    FIELD_LAYOUT_STYLES,
    undefined,
    undefined,
    ['styles'],
  );

  if (!Object.keys(layoutStyles).length) {
    return { styles, field: {}, fillWidth: false, fillHeight: false };
  }

  for (const [logical, physical] of PHYSICAL_SIZES) {
    if (!(logical in layoutStyles)) continue;

    if (layoutStyles[physical] === undefined) {
      layoutStyles[physical] = layoutStyles[logical];
    }

    delete layoutStyles[logical];
  }

  const sizes = (names: string[]) =>
    names.some((name) => isSizing(layoutStyles[name]));
  const fillWidth = sizes(FILL_WIDTH_STYLES);
  const fillHeight =
    sizes(FILL_HEIGHT_STYLES) || (fillHeightOnFlex && sizes(FLEX_STYLES));

  return {
    styles,
    field: {
      fieldStyles: mergeStyleLayers(record.fieldStyles, layoutStyles),
      fieldProps:
        fillWidth || fillHeight
          ? mergeProps(record.fieldProps, {
              mods: { 'fill-width': fillWidth, 'fill-height': fillHeight },
            })
          : record.fieldProps,
    },
    fillWidth,
    fillHeight,
  };
}

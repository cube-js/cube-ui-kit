import { AriaLabelingProps } from '@react-types/shared';
import { AllHTMLAttributes, ComponentType, CSSProperties } from 'react';

import {
  BASE_STYLES,
  BLOCK_INNER_STYLES,
  BLOCK_OUTER_STYLES,
  BLOCK_STYLES,
  COLOR_STYLES,
  CONTAINER_STYLES,
  DIMENSION_STYLES,
  FLOW_STYLES,
  INNER_STYLES,
  OUTER_STYLES,
  POSITION_STYLES,
  TEXT_STYLES,
} from './styles/list';
import { Styles } from './styles/types';

export interface GlobalStyledProps {
  breakpoints?: number[];
}

/** Allowed mod value types */
export type ModValue = boolean | string | number | undefined | null;

/**
 * Type for element modifiers (mods prop).
 * Can be used as a generic to define known modifiers with autocomplete:
 * @example
 * type ButtonMods = Mods<{
 *   loading?: boolean;
 *   selected?: boolean;
 * }>;
 */
export type Mods<T extends Record<string, ModValue> = {}> = T & {
  [key: string]: ModValue;
};

/**
 * Token value: string or number (processed), boolean for special handling, undefined/null (skipped).
 * For color tokens (#name), boolean `true` is converted to `transparent`.
 * For non-color tokens ($name), boolean `true` results in an empty string value.
 * Boolean `false` results in no CSS output (token is skipped).
 */
export type TokenValue = string | number | boolean | undefined | null;

/**
 * Tokens definition for inline CSS custom properties.
 * - `$name` keys become `--name` CSS properties
 * - `#name` keys become `--name-color` and `--name-color-rgb` CSS properties
 */
export type Tokens = {
  [key: `$${string}` | `#${string}`]: TokenValue;
};

type Caps =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z';

export interface BasePropsWithoutChildren<K extends TagName = TagName>
  extends Pick<AllHTMLAttributes<HTMLElement>, 'className' | 'role' | 'id'> {
  /** The HTML tag or React component to render as */
  as?: K | ComponentType<any>;
  /** QA ID for e2e testing. An alias for `data-qa` attribute. */
  qa?: string;
  /** QA value for e2e testing. An alias for `data-qaval` attribute. */
  qaVal?: string | number;
  /** Inner element name */
  element?: `${Caps}${string}`;
  /** The style map */
  styles?: Styles;
  /** The list of responsive points in pixels */
  breakpoints?: number[];
  /** Whether the element has the block layout outside */
  block?: boolean;
  /** Whether the element has the inline layout outside */
  inline?: boolean;
  /** The list of element modifiers **/
  mods?: Mods;
  /** Whether the element is hidden (`hidden` attribute is set) */
  isHidden?: boolean;
  /** Whether the element is disabled (`disabled` attribute is set) */
  isDisabled?: boolean;
  /** Plain css for the element */
  css?: string;
  /** The CSS style map */
  style?:
    | CSSProperties
    | (CSSProperties & { [key: string]: string | number | null | undefined });
  /** User-defined theme for the element. Mapped to data-theme attribute. Use `default`, or `danger`, or any custom string value you need. */
  theme?:
    | 'default'
    | 'danger'
    | 'special'
    | 'success'
    | 'warning'
    | 'note'
    | (string & {});
  /** CSS custom property tokens rendered as inline styles */
  tokens?: Tokens;
}

export interface BaseProps<K extends TagName = TagName>
  extends AriaLabelingProps,
    BasePropsWithoutChildren<K>,
    Pick<AllHTMLAttributes<HTMLElementTagNameMap[K]>, 'children'> {}

export interface AllBaseProps<K extends TagName = TagName>
  extends BaseProps<K>,
    Omit<
      AllHTMLAttributes<HTMLElementTagNameMap[K]>,
      | 'style'
      | 'disabled'
      | 'hidden'
      | 'css'
      | 'content'
      | 'translate'
      | 'as'
      | 'form'
      | 'bgcolor'
      | 'background'
      | 'align'
      | 'border'
      | 'color'
      | 'height'
      | 'size'
      | 'width'
      | 'prefix'
    > {}

export type BaseStyleProps = Pick<Styles, (typeof BASE_STYLES)[number]>;
export type PositionStyleProps = Pick<Styles, (typeof POSITION_STYLES)[number]>;
export type BlockStyleProps = Pick<Styles, (typeof BLOCK_STYLES)[number]>;
export type BlockInnerStyleProps = Pick<
  Styles,
  (typeof BLOCK_INNER_STYLES)[number]
>;
export type BlockOuterStyleProps = Pick<
  Styles,
  (typeof BLOCK_OUTER_STYLES)[number]
>;
export type ColorStyleProps = Pick<Styles, (typeof COLOR_STYLES)[number]>;
export type TextStyleProps = Pick<Styles, (typeof TEXT_STYLES)[number]>;
export type DimensionStyleProps = Pick<
  Styles,
  (typeof DIMENSION_STYLES)[number]
>;
export type FlowStyleProps = Pick<Styles, (typeof FLOW_STYLES)[number]>;
export type ContainerStyleProps = Pick<
  Styles,
  (typeof CONTAINER_STYLES)[number]
>;
export type OuterStyleProps = Pick<Styles, (typeof OUTER_STYLES)[number]>;
export type InnerStyleProps = Pick<Styles, (typeof INNER_STYLES)[number]>;

export type ShortGridStyles = {
  template?: Styles['gridTemplate'];
  columns?: Styles['gridColumns'];
  rows?: Styles['gridRows'];
  areas?: Styles['gridAreas'];
};

export interface Props {
  [key: string]: any;
}

export type TagName = keyof HTMLElementTagNameMap;

// =============================================================================
// Tasty Extension Configuration Types
// =============================================================================

/**
 * Configuration type for tasty.config.ts files.
 * Used by the Tasty VSCode extension for validation and autocomplete.
 *
 * @example
 * ```typescript
 * import type { TastyExtensionConfig } from '@cube-dev/ui-kit';
 *
 * const config: TastyExtensionConfig = {
 *   tokens: ['#primary', '#danger', '$spacing'],
 *   units: ['x', 'r', 'bw'],
 *   states: ['@mobile', '@tablet', '@dark'],
 *   presets: ['h1', 'h2', 't1', 't2'],
 * };
 *
 * export default config;
 * ```
 */
export interface TastyExtensionConfig {
  /**
   * Extend another config file. Path is relative to this config file.
   * The extended config is merged first, then this config's values are added.
   * @example '../tasty.config.ts'
   */
  extends?: string;

  /**
   * Valid token names for validation and autocomplete.
   * Use # prefix for colors, $ prefix for custom properties.
   * Set to `false` to disable token validation (overrides parent).
   * @example ['#primary', '#danger', '$spacing', '$gap']
   */
  tokens?: false | string[];

  /**
   * Valid custom unit names.
   * Set to `false` to disable unit validation (overrides parent).
   * @example ['x', 'r', 'bw', 'cols']
   */
  units?: false | string[];

  /**
   * Valid custom function names.
   * Set to `false` to disable function validation (overrides parent).
   * @example ['clamp', 'double']
   */
  funcs?: false | string[];

  /**
   * State alias names for autocomplete.
   * Must start with @ prefix.
   * @example ['@mobile', '@tablet', '@dark']
   */
  states?: string[];

  /**
   * Valid preset names for the `preset` style property.
   * Tasty has no built-in presets - they are project-specific.
   * @example ['h1', 'h2', 'h3', 't1', 't2', 't3', 'tag']
   */
  presets?: string[];

  /**
   * Custom style property names added via configure({ handlers }).
   * Suppresses "unknown property" warnings for these names.
   * @example ['myGradient', 'customLayout', 'brandBorder']
   */
  styles?: string[];

  /**
   * Descriptions for presets, shown on hover in the extension.
   * Maps preset names to human-readable descriptions.
   * @example { h1: 'Heading 1 (36px/44px, semibold)', t1: 'Text large (18px/24px)' }
   */
  presetDescriptions?: Record<string, string>;

  /**
   * Descriptions for state aliases, shown on hover in the extension.
   * Maps state names to human-readable descriptions.
   * @example { '@mobile': 'Mobile viewport (width < 768px)' }
   */
  stateDescriptions?: Record<string, string>;
}

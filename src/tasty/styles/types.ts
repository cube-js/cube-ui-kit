import { CSSProperties } from 'react';

import { KeyframesSteps, PropertyDefinition } from '../injector/types';
import { StyleValue, StyleValueStateMap } from '../utils/styles';

/**
 * Extensible interface for named color tokens.
 * Augment this interface to register project-specific color names
 * for autocomplete in `fill`, `color`, `svgFill`, and other color style props.
 *
 * @example
 * ```typescript
 * declare module '@cube-dev/ui-kit' {
 *   interface TastyNamedColors {
 *     primary: true;
 *     danger: true;
 *   }
 * }
 * ```
 */
 
export interface TastyNamedColors {}

type NamedColorKey = Extract<keyof TastyNamedColors, string>;
type NamedColor = [NamedColorKey] extends [never] ? string : NamedColorKey;

/**
 * Extensible interface for typography preset names.
 * Augment this interface to register project-specific preset names for autocomplete.
 *
 * @example
 * ```typescript
 * declare module '@cube-dev/ui-kit' {
 *   interface TastyPresetNames {
 *     h1: true;
 *     t3: true;
 *   }
 * }
 * ```
 */
 
export interface TastyPresetNames {}

type PresetNameKey = Extract<keyof TastyPresetNames, string>;
type PresetName = [PresetNameKey] extends [never] ? string : PresetNameKey;

type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type OpaquePercentage = '' | `.${Digit}` | `.${Digit}${Digit}` | '.100';
export type NoType = false | null | undefined;

export interface StylesInterface
  extends Omit<
    CSSProperties,
    | 'color'
    | 'fill'
    | 'font'
    | 'outline'
    | 'type'
    | 'gap'
    | 'padding'
    | 'margin'
    | 'width'
    | 'height'
    | 'border'
    | 'transition'
    | 'placeContent'
    | 'placeItems'
  > {
  /**
   * @deprecated Use `flow` style instead.
   */
  flexDirection: CSSProperties['flexDirection'];
  /**
   * @deprecated Use `placeContent`, `placeItems`, `gridColumns`, `gridRows`, and `gridTemplate` styles instead.
   */
  grid: CSSProperties['grid'];
  /**
   * @deprecated Use `flexShrink`, `flexGrow`, and `flexBasis` styles instead.
   */
  flex: CSSProperties['flex'];
  /**
   * Set the background color of the element. Shortcut for `background-color` with enhanced support for Tasty color tokens and syntaxes.
   *
   * Examples:
   * - `fill="#purple.10"` // purple background with 10% opacity
   * - `fill="#danger"` // danger theme color
   * - `fill="rgb(255 128 0)"` // custom RGB color
   * - `fill={true}` // default fill color
   */
  fill?:
    | `#${NamedColor}${OpaquePercentage}`
    | `rgb(${string})`
    | `rgba(${string})`
    | boolean
    | (string & {});
  /**
   * @deprecated Use `fill` instead.
   */
  backgroundColor?: CSSProperties['backgroundColor'];
  /**
   * Set the background image of the element. Shortcut for `background-image` with enhanced support for Tasty tokens.
   *
   * Examples:
   * - `image="url(/path/to/image.png)"` // image from URL
   * - `image="linear-gradient(to right, #purple, #danger)"` // gradient
   */
  image?: CSSProperties['backgroundImage'];
  /**
   * @deprecated Use `image` instead.
   */
  backgroundImage?: CSSProperties['backgroundImage'];
  /**
   * @deprecated Use separate background styles (`fill`, `image`, `backgroundSize`, etc.) instead.
   * When set, overrides all other background-related styles.
   */
  background?: CSSProperties['background'];
  /**
   * Set the fill color of SVG elements. Outputs the native CSS `fill` property with enhanced support for Tasty color tokens and syntaxes.
   *
   * Examples:
   * - `svgFill="#purple.10"` // purple fill with 10% opacity
   * - `svgFill="#danger"` // danger theme color
   * - `svgFill="rgb(255 128 0)"` // custom RGB color
   * - `svgFill="currentColor"` // inherit from parent color
   */
  svgFill?:
    | `#${NamedColor}${OpaquePercentage}`
    | `rgb(${string})`
    | `rgba(${string})`
    | (string & {});
  /**
   * Set the text (current) color of the element. Shortcut for `color` with enhanced support for Tasty color tokens and syntaxes.
   *
   * Examples:
   * - `color="#purple"` // purple text color
   * - `color="#danger.6"` // danger color with 60% opacity
   * - `color="red"` // CSS color name
   * - `color={true}` // currentColor
   */
  color?:
    | `#${NamedColor}${OpaquePercentage}`
    | `rgb(${string})`
    | `rgba(${string})`
    | boolean
    | string;
  /**
   * The fade style applies gradient-based fading masks to the edges of an element. Replaces complex CSS mask gradients with a simple, declarative API.
   *
   * Syntax: `[width] [directions] [#from-color] [#to-color]`
   *
   * Multiple groups can be separated by commas to specify different colors per direction.
   *
   * Color tokens (optional):
   * - First color: transparent start of gradient (default: `rgb(0 0 0 / 0)`)
   * - Second color: opaque end of gradient (default: `rgb(0 0 0 / 1)`)
   *
   * Examples:
   * - `fade="top"` // fade only top edge with default width
   * - `fade="2x left right"` // fade left and right edges with 2x width
   * - `fade="1x top"` // fade only top edge with 1x width
   * - `fade="3x 1x top bottom"` // top: 3x width, bottom: 1x width
   * - `fade="2x #transparent #dark"` // custom colors for gradient mask
   * - `fade="1x top #clear #solid"` // top edge with custom mask colors
   * - `fade="top #red #blue, bottom #green #yellow"` // different colors per direction
   * - `fade="2x top #a #b, 1x bottom #c #d"` // different widths and colors per direction
   */
  fade?: 'top' | 'right' | 'bottom' | 'left' | string;
  /**
   * @deprecated Use `scrollbar` style instead.
   * Whether the element has styled scrollbar.
   */
  styledScrollbar?: boolean;
  /**
   * The scrollbar style provides a powerful and flexible way to control the appearance and behavior of scrollbars across browsers. It supports custom sizing, color, visibility, and advanced modifiers for modern UI needs.
   *
   * Syntax: `[modifiers] [size] [color1] [color2] [color3]`
   *
   * Modifiers: `thin`, `none`, `auto`, `stable`, `both-edges`, `always`, `styled`
   *
   * Examples:
   * - `scrollbar={true}` // thin scrollbar, default color
   * - `scrollbar="thin 10px #purple.40 #dark.04"`
   * - `scrollbar="styled 12px #purple.40 #dark.04 #white.10"`
   * - `scrollbar="none"`
   * - `scrollbar="always 8px #primary.50 #white.02"`
   */
  scrollbar?: string | boolean | number;
  /**
   * Set font weight for bold texts.
   */
  boldFontWeight?: number;
  /**
   * The gap style is a powerful, cross-layout shorthand for spacing between child elements. Works with flex, grid, and block layouts.
   *
   * For flex/grid: sets native `gap` property
   * For block layouts: emulated using margin on children
   *
   * Examples:
   * - `gap="2x"` // gap: 2x (or margin-bottom: 2x for block)
   * - `gap="1x 2x"` // row gap: 1x, column gap: 2x
   * - `gap={true}` // default gap (1x)
   */
  gap?: CSSProperties['gap'] | string | boolean;
  /**
   * Shorthand for element padding. Supports custom units, directional modifiers, and design-system-driven defaults.
   *
   * Examples:
   * - `padding="2x 1x"` // top/bottom: 2x, left/right: 1x
   * - `padding="2x top"` // only top padding: 2x
   * - `padding="1x left right"` // left and right padding: 1x
   * - `padding={true}` // default padding on all sides
   */
  padding?: CSSProperties['padding'] | string | boolean;
  /**
   * Shorthand for element margin. Supports custom units, directional modifiers, and design-system-driven defaults.
   *
   * Examples:
   * - `margin="2x 1x"` // top/bottom: 2x, left/right: 1x
   * - `margin="2x top"` // only top margin: 2x
   * - `margin="1x left right"` // left and right margin: 1x
   * - `margin={true}` // default margin on all sides
   */
  margin?: CSSProperties['margin'] | string | boolean;
  /**
   * Concise shorthand for setting element width, including min-width and max-width. Supports custom units and advanced sizing keywords.
   *
   * Syntax: `[value]` | `[min max]` | `[min value max]` | `[modifier value]`
   *
   * Modifiers: `min`, `max`
   * Keywords: `stretch`, `max-content`, `min-content`, `fit-content`
   *
   * Examples:
   * - `width="10x"` // width: 10x
   * - `width="1x 10x"` // min-width: 1x; max-width: 10x
   * - `width="min 2x"` // min-width: 2x
   * - `width="stretch"` // width: stretch (fill-available)
   * - `width={true}` // width: auto
   */
  width?: CSSProperties['width'] | string | boolean;
  /**
   * Concise shorthand for setting element height, including min-height and max-height. Supports custom units and advanced sizing keywords.
   *
   * Syntax: `[value]` | `[min max]` | `[min value max]` | `[modifier value]`
   *
   * Modifiers: `min`, `max`
   * Keywords: `stretch`, `max-content`, `min-content`, `fit-content`
   *
   * Examples:
   * - `height="100px"` // height: 100px
   * - `height="1x 5x 10x"` // min-height: 1x; height: 5x; max-height: 10x
   * - `height="min 2x"` // min-height: 2x
   * - `height={true}` // height: auto
   */
  height?: CSSProperties['height'] | string | boolean;
  /**
   * Shorthand for border width, style, and color. Supports directional modifiers and design-system defaults.
   *
   * Syntax: `[width] [style] [color] [directions]` | `[directions]` | `true`
   *
   * Multiple groups can be separated by commas. Later groups override earlier groups for conflicting directions.
   *
   * Examples:
   * - `border={true}` // default border on all sides (1bw solid)
   * - `border="2bw dashed #purple"` // 2bw dashed purple border
   * - `border="2bw top"` // only top border: 2bw solid
   * - `border="dotted #danger left right"` // left/right: 1bw dotted danger
   * - `border="1bw #red, 2bw #blue top"` // all sides red 1bw, top overridden to blue 2bw
   * - `border="1bw, dashed top bottom, #purple left right"` // base 1bw, dashed on top/bottom, purple on left/right
   */
  border?: CSSProperties['border'] | string | boolean;
  /**
   * Powerful shorthand for CSS transitions using semantic names and design tokens. Supports grouped transitions for common UI effects.
   *
   * Semantic names: `fade`, `fill`, `border`, `radius`, `shadow`, `preset`, `gap`, `theme`
   * Multiple transitions: separated by commas
   *
   * Examples:
   * - `transition="fill 0.2s, radius 0.3s"` // transitions background-color and border-radius
   * - `transition="fade 0.15s ease-in"` // transitions mask with easing
   * - `transition="theme 0.3s"` // transitions all theme-related properties
   * - `transition="preset 0.2s"` // transitions typography properties
   */
  transition?: CSSProperties['transition'] | string;
  /**
   * Whether the element is hidden using `display: none`. Boolean shortcut for conditional element visibility.
   *
   * Examples:
   * - `hide={true}` // display: none
   * - `hide={false}` // element remains visible
   */
  hide?: boolean;
  /**
   * The shadow style adds shadow effects around an element's frame. Supports multiple effects separated by commas with X/Y offsets, blur, spread radius, and color.
   *
   * Examples:
   * - `shadow="1x .5x .5x #dark.50"` // custom shadow with Tasty units and colors
   * - `shadow="0 1x 2x #dark.20"` // standard shadow syntax
   * - `shadow={true}` // default shadow from design system
   */
  shadow?: string | boolean;
  /**
   * The radius style rounds the corners of an element's outer border edge. Supports custom units, advanced shapes, and directional modifiers.
   *
   * Syntax: `[value] [modifiers]` | `[shape]` | `true`
   *
   * Shapes: `round` (fully rounded), `ellipse` (50%), `leaf`, `backleaf` (asymmetric)
   * Directional modifiers: `top`, `right`, `bottom`, `left`
   *
   * Examples:
   * - `radius="2r"` // border-radius: calc(var(--radius) * 2)
   * - `radius={true}` // default radius (1r)
   * - `radius="round"` // fully rounded (9999rem)
   * - `radius="leaf"` // asymmetric leaf shape
   * - `radius="1r top"` // round only top corners
   */
  radius?: 'round' | 'ellipse' | 'leaf' | 'backleaf' | string | true;
  /**
   * The flow style is a unified shorthand for controlling layout direction and wrapping in both flex and grid containers. Replaces `flexDirection` and `gridAutoFlow`.
   *
   * For flex: sets `flex-flow` (direction + wrapping)
   * For grid: sets `grid-auto-flow` (direction + density)
   * For block: determines gap direction (row/column)
   *
   * Syntax: `[direction] [wrap|dense]`
   *
   * Examples:
   * - `flow="row wrap"` // flex-flow: row wrap
   * - `flow="column dense"` // grid-auto-flow: column dense
   * - `flow="row"` // primary axis direction
   */
  flow?: CSSProperties['flexFlow'] | CSSProperties['gridAutoFlow'] | string;
  /**
   * The gridAreas style specifies named grid areas, establishing cells in the grid and assigning them names.
   *
   * Examples:
   * - `gridAreas='"header header" "sidebar content" "footer footer"'`
   */
  gridAreas?: CSSProperties['gridTemplateAreas'];
  /**
   * The gridColumns style defines line names and track sizing functions of grid columns.
   *
   * Examples:
   * - `gridColumns="1fr 2fr 1fr"` // three columns with flex ratios
   * - `gridColumns={3}` // three equal columns (shorthand)
   * - `gridColumns="repeat(auto-fit, minmax(200px, 1fr))"` // responsive columns
   */
  gridColumns?: CSSProperties['gridTemplateColumns'] | number;
  /**
   * The gridRows style defines line names and track sizing functions of grid rows.
   *
   * Examples:
   * - `gridRows="auto 1fr auto"` // header, content, footer layout
   * - `gridRows={4}` // four equal rows (shorthand)
   * - `gridRows="repeat(3, 100px)"` // three 100px rows
   */
  gridRows?: CSSProperties['gridTemplateRows'] | number;
  /**
   * The gridTemplate style is a shorthand property for defining grid columns, rows, and areas simultaneously.
   *
   * Examples:
   * - `gridTemplate='"header header" auto "content sidebar" 1fr / 2fr 1fr'`
   */
  gridTemplate?: CSSProperties['gridTemplate'];
  /**
   * The font style specifies a prioritized list of font family names with design-system-driven defaults and fallbacks.
   *
   * Examples:
   * - `font="monospace"` // monospace font stack
   * - `font="Helvetica, Arial, sans-serif"` // custom font list
   * - `font={true}` // default design system font
   */
  font?: CSSProperties['fontFamily'] | boolean;
  /**
   * The outline style sets the outline for the element.
   *
   * Syntax: `[width] [style] [color] / [offset]` | `true`
   *
   * Examples:
   * - `outline="2ow dashed #purple"` // 2ow dashed purple outline
   * - `outline="2ow #danger / 1x"` // 2ow solid danger outline, 1x offset
   * - `outline={true}` // default outline (1ow solid)
   */
  outline?: string | boolean;
  /**
   * The outline offset style sets the offset of the outline.
   *
   * Examples:
   * - `outlineOffset="4px"` // 4px offset
   * - `outlineOffset="1x"` // 1x (8px) offset
   */
  outlineOffset?: string | number;
  /**
   * The preset style sets base text settings according to named presets. Affects `font-size`, `line-height`, `letter-spacing`, `font-weight`, and `text-transform`.
   *
   * Preset names are project-specific. Augment `TastyPresetNames` to register them for autocomplete.
   *
   * Examples:
   * - `preset="h1"` // heading 1 typography
   * - `preset="h2 strong"` // bold heading 2
   * - `preset="t3"` // text size 3
   */
  preset?: PresetName | (string & {});
  /**
   * Shorthand for `align-items` and `align-content`. Sets both properties for unified vertical alignment in flex/grid layouts.
   *
   * Examples:
   * - `align="center"` // align-items: center; align-content: center
   * - `align="flex-start"` // align both to start
   * - `align="space-between"` // distribute space between items
   */
  align?: CSSProperties['alignItems'] | CSSProperties['alignContent'];
  /**
   * Shorthand for `justify-items` and `justify-content`. Sets both properties for unified horizontal alignment in flex/grid layouts.
   *
   * Examples:
   * - `justify="center"` // justify-items: center; justify-content: center
   * - `justify="space-between"` // distribute space between items
   * - `justify="flex-end"` // align both to end
   */
  justify?: CSSProperties['justifyItems'] | CSSProperties['justifyContent'];
  /**
   * Shorthand for `place-items` and `place-content`. Sets both properties for unified alignment of both axes in grid/flex layouts.
   *
   * Examples:
   * - `place="center"` // place-items: center; place-content: center
   * - `place="start end"` // place-items: start; place-content: end
   * - `place="stretch"` // place both to stretch
   */
  place?: CSSProperties['placeItems'] | CSSProperties['placeContent'] | string;
  /**
   * Sets `place-content` property for aligning and distributing content in grid/flex containers.
   *
   * Examples:
   * - `placeContent="center"` // center content in both axes
   * - `placeContent="space-between"` // distribute content with space between
   */
  placeContent?: CSSProperties['placeContent'];
  /**
   * Sets `place-items` property for aligning items in grid/flex containers.
   *
   * Examples:
   * - `placeItems="center"` // center items in both axes
   * - `placeItems="start end"` // start on block axis, end on inline axis
   */
  placeItems?: CSSProperties['placeItems'];
  /**
   * Shorthand for `top`, `right`, `bottom`, and `left` offsets. Supports custom units, directional modifiers, and positioning.
   *
   * Examples:
   * - `inset="0"` // all sides: 0
   * - `inset="2x top"` // only top offset: 2x
   * - `inset="1x left right"` // left and right offsets: 1x
   * - `inset={true}` // all sides: 0
   */
  inset?: 'top' | 'right' | 'bottom' | 'left' | string | CSSProperties['inset'];
  /**
   * Local keyframes definitions for this component.
   * Keys are animation names, values are keyframes step definitions.
   * Local keyframes override global keyframes with the same name.
   *
   * Examples:
   * - `'@keyframes': { fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } } }`
   * - `'@keyframes': { pulse: { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.05)' } } }`
   */
  '@keyframes'?: Record<string, KeyframesSteps>;
  /**
   * CSS @property definitions for custom properties using tasty token syntax.
   * Properties are registered once and are permanent (never removed).
   *
   * Token formats:
   * - `$name` for regular properties → `--name` (requires syntax to be specified)
   * - `#name` for color properties → `--name-color` (auto-sets syntax: '<color>', defaults initialValue: 'transparent')
   *
   * Examples:
   * - `'@properties': { '$rotation': { syntax: '<angle>', inherits: false, initialValue: '45deg' } }`
   * - `'@properties': { '#theme': { initialValue: 'purple' } }` // syntax: '<color>' is auto-set
   */
  '@properties'?: Record<string, PropertyDefinition>;
  /**
   * Apply one or more predefined style recipes by name.
   * Recipes are defined globally via `configure({ recipes: { ... } })`.
   * Multiple recipes are separated by commas and merged in order.
   * Component styles override recipe values.
   *
   * Examples:
   * - `recipe: 'card'` // Apply the 'card' recipe
   * - `recipe: 'card, elevated'` // Apply 'card' then 'elevated', then component styles
   * - `recipe: ''` // Clear recipes from base styles when extending
   */
  recipe?: string;
}

export type SuffixForSelector =
  | '&'
  | '.'
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
export type Selector = `${SuffixForSelector}${string}`;
export type NotSelector = Exclude<string, Selector | keyof StylesInterface>;

/** Special style keys that should not be wrapped in StyleValue/StyleValueStateMap */
type SpecialStyleKeys = '@keyframes' | '@properties' | 'recipe';

export type StylesWithoutSelectors = {
  [key in keyof StylesInterface as key extends SpecialStyleKeys
    ? never
    : key]?:
    | StyleValue<StylesInterface[key]>
    | StyleValueStateMap<StylesInterface[key]>;
};

/**
 * Index signature for recipe-specific arbitrary keys.
 * Supports local predefined states (`@name`), vendor-prefixed CSS properties (`-webkit-*`),
 * CSS custom properties (`$name`), and color tokens (`#name`).
 * Unlike StylesIndexSignature, does NOT allow sub-element selectors (recipes are flat).
 */
export interface RecipeIndexSignature {
  [key: string]:
    | StyleValue<string | number | boolean | undefined>
    | StyleValueStateMap<string | number | boolean | undefined>;
}

/**
 * Style type for recipe definitions.
 * Like StylesWithoutSelectors but also allows `@keyframes`, `@properties`,
 * local predefined states, and vendor-prefixed CSS properties.
 * Excludes `recipe` to prevent recursive references.
 */
export type RecipeStyles = StylesWithoutSelectors &
  RecipeIndexSignature & {
    '@keyframes'?: StylesInterface['@keyframes'];
    '@properties'?: StylesInterface['@properties'];
  };

/** Special properties that are not regular style values */
export interface SpecialStyleProperties {
  '@keyframes'?: StylesInterface['@keyframes'];
  '@properties'?: StylesInterface['@properties'];
  recipe?: StylesInterface['recipe'];
}

/** Index signature for arbitrary style keys (sub-elements, CSS variables, etc.) */
export interface StylesIndexSignature {
  [key: string]:
    | StyleValue<string | number | boolean | undefined>
    | StyleValueStateMap<string | number | boolean | undefined>
    | Styles
    | false // Removes all styles for this sub-element when extending
    | StylesInterface['@keyframes']
    | StylesInterface['@properties'];
  /**
   * Selector combinator: `undefined` (descendant, default), `'>'` (child), `'+'` (adjacent), `'~'` (sibling).
   * Can chain with capitalized names: `'> Body > Row >'`. Spaces required around combinators.
   */
  $?: string;
}

export type Styles = StylesWithoutSelectors &
  SpecialStyleProperties &
  StylesIndexSignature;

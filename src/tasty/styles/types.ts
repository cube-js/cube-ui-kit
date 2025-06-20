import { CSSProperties } from 'react';

import { ResponsiveStyleValue } from '../utils/styles';

type NamedColor =
  | 'purple'
  | 'purple-text'
  | 'purple-icon'
  | 'purple-bg'
  | 'purple-01'
  | 'purple-02'
  | 'purple-03'
  | 'purple-04'
  | 'dark'
  | 'dark-01'
  | 'dark-02'
  | 'dark-03'
  | 'dark-04'
  | 'dark-05'
  | 'dark-bg'
  | 'text'
  | 'primary'
  | 'disabled'
  | 'disabled-bg'
  | 'disabled-text'
  | 'danger'
  | 'danger-bg'
  | 'danger-text'
  | 'danger-icon'
  | 'success'
  | 'success-bg'
  | 'success-text'
  | 'success-icon'
  | 'note'
  | 'note-bg'
  | 'note-text'
  | 'note-icon'
  | 'white'
  | 'light'
  | 'light-grey'
  | 'black'
  | 'pink'
  | 'pink-01'
  | 'pink-02'
  | 'border'
  | 'clear'
  | 'shadow'
  | 'draft'
  | 'minor';
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
   * Syntax: `[width] [directions]`
   *
   * Examples:
   * - `fade="top"` // fade only top edge with default width
   * - `fade="2x left right"` // fade left and right edges with 2x width
   * - `fade="1x top"` // fade only top edge with 1x width
   * - `fade="3x 1x top bottom"` // top: 3x width, bottom: 1x width
   */
  fade?: 'top' | 'right' | 'bottom' | 'left' | string;
  /**
   * Whether styles of the element should be reset.
   * Possible values: `input`, `button`.
   */
  reset?: 'input' | 'button';
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
   * Examples:
   * - `border={true}` // default border on all sides (1bw solid)
   * - `border="2bw dashed #purple"` // 2bw dashed purple border
   * - `border="2bw top"` // only top border: 2bw solid
   * - `border="dotted #danger left right"` // left/right: 1bw dotted danger
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
   * The group radius style rounds the corners of a container's outer border edge by applying radius styles to its children.
   *
   * Syntax: `[value] [shape]` | `true`
   *
   * Examples:
   * - `groupRadius="2r"` // apply 2r radius to children
   * - `groupRadius="round"` // fully rounded children
   * - `groupRadius="ellipse"` // elliptical children corners
   * - `groupRadius={true}` // default group radius
   */
  groupRadius?: 'round' | 'ellipse' | string | boolean;
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
   * The outline style sets the outline for the element using `box-shadow` CSS property. The outline is drawn inside if `inset` modifier is set.
   *
   * Syntax: `[width] [style] [color] [offset]` | `[width] [color] inset` | `true`
   *
   * Examples:
   * - `outline="2ow dashed #purple"` // 2ow dashed purple outline
   * - `outline="2ow #danger 1x"` // 2ow solid danger outline, 1x offset
   * - `outline="inset"` // inset outline with defaults
   * - `outline={true}` // default outline (1ow solid)
   */
  outline?: string | boolean;
  /**
   * The preset style sets base text settings according to named presets. Affects `font-size`, `line-height`, `letter-spacing`, `font-weight`, and `text-transform`.
   *
   * Available presets:
   * - Headings: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`
   * - Text: `t1`, `t2`, `t2m`, `t3`, `t3m`, `t4`, `t4m`
   * - Paragraphs: `p1`, `p2`, `p3`, `p4`
   * - Main text: `m1`, `m2`, `m3`
   * - Captions: `c1`, `c2`
   * - Special: `tag`, `strong`, `em`, `default`
   *
   * Examples:
   * - `preset="h1"` // heading 1 typography
   * - `preset="h2 strong"` // bold heading 2
   * - `preset="t3"` // text size 3
   */
  preset?:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 't1'
    | 't2'
    | 't2m'
    | 't3'
    | 't3m'
    | 't4'
    | 'p1'
    | 'p2'
    | 'p3'
    | 'p4'
    | 'c1'
    | 'c2'
    | 'tag'
    | 'default'
    | string;
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

export type StylesWithoutSelectors = {
  [key in keyof StylesInterface]?: ResponsiveStyleValue<StylesInterface[key]>;
};
export type Styles = StylesWithoutSelectors & {
  [key: string]:
    | ResponsiveStyleValue<string | number | boolean | undefined>
    | StylesWithoutSelectors;
};

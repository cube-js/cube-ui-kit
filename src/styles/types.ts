import { CSSProperties } from 'react';
import { ResponsiveStyleValue } from '../utils/styles';

type NamedColor =
  | 'purple'
  | 'purple-text'
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
  | 'text'
  | 'primary'
  | 'disabled'
  | 'disabled-bg'
  | 'disabled-text'
  | 'danger'
  | 'danger-bg'
  | 'danger-text'
  | 'success'
  | 'success-bg'
  | 'success-text'
  | 'note'
  | 'note-bg'
  | 'note-text'
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
  extends Omit<CSSProperties, 'color' | 'fill' | 'font' | 'outline'> {
  /** Set the background color of the element.
   * ```
   * fill="#{name_of_the_color}"
   * fill="#dark" // the dark color with 100% opacity
   * fill="#dark.3" // the dark color with 30% opacity
   * fill="#dark.30" // the dark color with 30% opacity
   * ```
   */
  fill?:
    | `#${NamedColor}${OpaquePercentage}`
    | `rgb(${string})`
    | `rgba(${string})`
    | boolean
    | string;
  /** Set the text (current) color of the element
   * ```
   * color="#{name_of_the_color}"
   * color="#dark" // the dark color with 100% opacity
   * color="#dark.3" // the dark color with 30% opacity
   * color="#dark.30" // the dark color with 30% opacity
   * ```
   */
  color?:
    | `#${NamedColor}${OpaquePercentage}`
    | `rgb(${string})`
    | `rgba(${string})`
    | boolean
    | string;
  /**
   * Whether styles of the element should be reset.
   * Possible values: `input`, `button`.
   */
  reset?: 'input' | 'button';
  /**
   * Whether the element has styled scrollbar.
   */
  styledScrollbar?: boolean;
  /**
   * Whether the element is hidden using `display: none`.
   */
  hide?: boolean;
  /**
   * The shadow style adds shadow effects around an element's frame. You can set multiple effects separated by commas. A box shadow is described by X and Y offsets relative to the element, blur and spread radius, and color.
   * Examples:
   * `shadow="1x .5x .5x #dark.50"`
   * `shadow="0 1x 2x #dark.20"`
   */
  shadow?: string;
  /**
   * The radius style rounds the corners of an element's outer border edge. You can set a single radius to make circular corners, or two radii to make elliptical corners.
   * Syntax: `[[<value> | [ <verticalValue> <horizontalValue>] ]? [ [ leaf | backleaf ] | [ 'top' | 'right' | 'bottom' | 'top' ]{1,2} ] ] | [ 'round' | 'ellipse' ] | true`
   * Examples: `"1x"`, `"2x 4x"`, `"top"`, `"round"`, `"3x leaf"`, `"ellipse"`.
   */
  radius?: 'round' | 'ellipse' | 'leaf' | 'backleaf' | string;
  /**
   * The group radius style rounds the corners of a container's outer border edge by applying radius style to to its children.
   * Syntax: `<value> [ 'round' | 'ellipse' ]? | true`
   * Examples: `"2r"`, `"round"`, `"ellipse"`.
   */
  groupRadius?: 'round' | 'ellipse' | string;
  /**
   * The flow style specifies the direction of a flex/grid container, as well as its wrapping behavior (for flex only).
   * Syntax: `[ [ row | row-reverse | column | column-reverse ] | [ nowrap | wrap | wrap-reverse ]  | [ [ row | column ] || dense ]`
   */
  flow?: CSSProperties['flexFlow'] | CSSProperties['gridAutoFlow'];
  /**
   * The gridAreas style specifies named grid areas, establishing the cells in the grid and assigning them names.
   */
  gridAreas?: CSSProperties['gridTemplateAreas'];
  /**
   * The gridColumns style defines the line names and track sizing functions of the grid columns.
   */
  gridColumns?: CSSProperties['gridTemplateColumns'] | number;
  /**
   * The gridRows style defines the line names and track sizing functions of the grid rows.
   */
  gridRows?: CSSProperties['gridTemplateRows'] | number;
  /**
   * The gridTemplate style is a shorthand property for defining grid columns, rows, and areas.
   */
  gridTemplate?: CSSProperties['gridTemplate'];
  /**
   * The font style specifies a prioritized list of one or more font family names and/or generic family names for the selected element. The style will also provide a reasonable fallback to system fonts.
   * Syntax: 'monospace' | <fontFamilyList> | true
   */
  font?: CSSProperties['fontFamily'] | boolean;
  /**
   * The outline style sets the outline for the element using `box-shadow` CSS property. The outline is drawn inside if `inset` modifier is set.
   * Syntax: <value> 'inset'?
   */
  outline?: CSSProperties['fontFamily'] | boolean;
  /**
   * The preset style sets the base text settings according to the names preset. Affected styles: `font-size`, `line-height`, `letter-spacing`, `font-weight` and `text-transform`.
   */
  preset?:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h5s'
    | 'h5m'
    | 'h6'
    | 't1'
    | 't2'
    | 't3'
    | 't4'
    | 't4m'
    | 'p1'
    | 'p2'
    | 'p3'
    | 'p4'
    | 'tag'
    | 'default'
    | string;
  /**
   * Shorthand for align-items and align-content.
   */
  align?: CSSProperties['alignItems'] | CSSProperties['alignContent'],
  /**
   * Shorthand for justify-items and justify-content.
   */
  justify?: CSSProperties['justifyItems'] | CSSProperties['justifyContent'],
}

export type SuffixForSelector = '&' | '.' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';
export type Selector = `${SuffixForSelector}${string}`;
export type NotSelector = Exclude<
  string,
  Selector | keyof StylesInterface
>;

export type StylesWithoutSelectors = {
  [key in keyof StylesInterface]?: ResponsiveStyleValue<StylesInterface[key] | string | number | boolean | undefined>;
};
export type Styles = StylesWithoutSelectors & {
  [key: string]:
    | ResponsiveStyleValue<string | number | boolean | undefined>
    | StylesWithoutSelectors;
};

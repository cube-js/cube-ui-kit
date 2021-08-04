import { CSSProperties } from 'react';
import { NuResponsiveStyleValue } from '../utils/styles';

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

export interface NuStylesInterface extends CSSProperties {
  /** Set the background color of the element.
   * ```
   * fill="#{name_of_the_color}"
   * fill="#dark" // the dark color with 100% opacity
   * fill="#dark.3" // the dark color with 30% opacity
   * fill="#dark.30" // the dark color with 30% opacity
   * ```
   */
  fill?: `#${NamedColor | `${NamedColor}${OpaquePercentage}`}` | string;
  /** Set the text (current) color of the element
   * ```
   * color="#{name_of_the_color}"
   * color="#dark" // the dark color with 100% opacity
   * color="#dark.3" // the dark color with 30% opacity
   * color="#dark.30" // the dark color with 30% opacity
   * ```
   */
  color?: `#${NamedColor | `${NamedColor}${OpaquePercentage}`}` | string;
  size?: 'md' | 'xs' | string;
  reset?: string;
  scrollBar?: string;
  hide?: string;
  shadow?: string;
  radius?: string;
  flow?: CSSProperties['flexFlow'];
  gridAreas?: CSSProperties['gridTemplateAreas'];
  gridColumns?: CSSProperties['gridTemplateColumns'];
  gridRows?: CSSProperties['gridTemplateRows'];
}

export type NuStyles = {
  [key in keyof NuStylesInterface]?: NuResponsiveStyleValue<
    NuStylesInterface[key]
  >;
} & { [key: string]: NuResponsiveStyleValue<string | number | undefined> };

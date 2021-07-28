export type NuStyleValue<T = null> =
  string
  | number
  | null
  | boolean
  | undefined
  | T
  | Array<string | number | null | boolean | undefined | T>;

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
type NoType = false | null | undefined;

export interface AllStyles {
  [key: string]: NuStyleValue,
  /** Set the background color of the element **/
  fill?: `#${NamedColor | `${NamedColor}${OpaquePercentage}`}` | NoType,
  /** Set the text (current) color of the element **/
  color?: `#${NamedColor | `${NamedColor}${OpaquePercentage}`}` | NoType,
  border?: NoType,
}

const styles: AllStyles = {
  fill: '#purple.3',
  other: '234',
}

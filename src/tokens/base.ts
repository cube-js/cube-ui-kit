import type { Styles } from '../tasty/styles/types';

/**
 * Base design system tokens.
 * These define the fundamental units and values used throughout the system.
 *
 * Keys use $ prefix for CSS custom properties.
 * Color values use tasty syntax (#color.opacity) which will be
 * processed when applied via useGlobalStyles.
 */
export const BASE_TOKENS: Styles = {
  // Typography base
  /** @deprecated Use preset tokens instead */
  '$font-size': '14px',
  /** @deprecated Use preset tokens instead */
  '$line-height': '20px',

  // Input typography
  '$input-font-size': '14px',
  '$input-line-height': '20px',
  '$input-letter-spacing': '0.02em',

  // Opacity & dimensions
  /** Opacity for disabled elements */
  '$disabled-opacity': '.4',
  /** Base gap unit for spacing (used with `.5x`, `1x`, `2x` etc.) */
  $gap: '8px',
  /** Stroke width for icons */
  '$stroke-width': 1.5,
  /** Focus outline width */
  '$outline-width': 'calc(1rem / 16 * 3)',
  /** Border width for bordered elements */
  '$border-width': '1px',

  // Border radius
  /** Base border radius (used with `1r`, `2r` etc.) */
  $radius: '6px',
  /** Larger radius using tasty calc: 1r + 0.5x */
  '$large-radius': '(1r + .5x)',
  /** Card border radius */
  '$card-radius': '(1r + .5x)',
  /** Sharp corner for leaf shapes */
  '$leaf-sharp-radius': '0px',

  // Misc dimensions
  /** Width of fade effect for overflowing content */
  '$fade-width': '32px',
  /** Minimum dialog width (responsive) */
  '$min-dialog-size': 'min(288px, calc(100vw - (2 * var(--gap))))',

  // Transitions
  /** Default transition duration */
  $transition: '80ms',
  /** Transition for disclosure animations */
  '$disclosure-transition': '120ms',

  // Semantic colors - using tasty color syntax with opacity
  /** Transparent color */
  '$clear-color': 'transparent',
  /** Opaque border color (not using opacity) */
  '$border-opaque-color': 'rgb(227 227 233)',
  /** Shadow color */
  '$shadow-color': '#dark.06',
  /** Draft/placeholder color */
  '$draft-color': '#dark.2',
  /** Minor/secondary text color */
  '$minor-color': '#dark.65',
  /** Danger background on hover */
  '$danger-bg-hover-color': '#danger.1',
  /** Dark at 75% opacity */
  '$dark-75-color': '#dark.75',
  /** Primary brand color */
  '$primary-color': '#purple',

  // Pink opacity variants
  '$pink-8-color': '#pink.2',
  '$pink-9-color': '#pink.1',

  // Disabled state colors
  '$disabled-color': '#dark-01.25',
  '$disabled-text-color': '#dark-01.25',
  '$disabled-bg-color': '#dark-05.2',

  // Scrollbar tokens
  '$scrollbar-width': '1.5x',
  '$scrollbar-outline-width': '1ow',
  '$scrollbar-radius': '1.5r',
  '$scrollbar-thumb-color': '#text.5',
  '$scrollbar-outline-color': '#clear',
  '$scrollbar-bg-color': '#dark-bg',
  '$scrollbar-corner-color': '#clear',
};

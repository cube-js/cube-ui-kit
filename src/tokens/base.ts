import type { Styles } from '../tasty/styles/types';

/**
 * Base design system tokens.
 * These define the fundamental units and values used throughout the system.
 *
 * Keys use $ prefix for CSS custom properties.
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
  /** Transition for tab animations */
  '$tab-transition': '120ms',
  /** Transition for fade animations */
  '$fade-transition': '200ms',

  // Scrollbar tokens
  '$scrollbar-width': '1.5x',
  '$scrollbar-outline-width': '1ow',
  '$scrollbar-radius': '1.5r',
  '#scrollbar-thumb': '#text.5',
  '#scrollbar-outline': '#clear',
  '#scrollbar-bg': '#dark-bg',
  '#scrollbar-corner': '#clear',
};

import type { Styles } from '@tenphi/tasty';

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
  '$sharp-radius': '0px',

  // Misc dimensions
  /**
   * Minimum dialog width (responsive).
   *
   * The viewport term must match the `100dvw - 8x` max-width that `Dialog`,
   * `Modal` and `Tray` set, because CSS resolves `min-width` *after*
   * `max-width`: if this floor can exceed that ceiling, the floor wins and the
   * dialog overflows its own viewport. It did, below ~352px — an Excel/Sheets
   * task pane is 300-350px, so every dialog there rendered 288px wide inside a
   * 236px box.
   */
  '$min-dialog-size': 'min(288px, calc(100dvw - (8 * var(--gap))))',

  // Transitions
  /** Default transition duration */
  $transition: '80ms',
  /** Transition for disclosure animations */
  '$disclosure-transition': '120ms',
  /** Transition for tab animations */
  '$tab-transition': '120ms',
  /** Transition for fade animations */
  '$fade-transition': '200ms',

  /**
   * Marks an element as carrying the token block. Not a design value — nothing
   * styles against it.
   *
   * `resolveTokenValue()` reads it to answer the one question a computed value
   * cannot: "are the kit's tokens in effect here?" Tasty registers `@property`
   * defaults with real initial values — `--gap` is `4px` off the block, not
   * `0px` — so a token read from outside `<Root>` comes back plausible and
   * wrong, and no amount of inspecting the value would reveal it. This is
   * declared alongside the tokens, so it is present exactly where they are.
   */
  '$tokens-applied': '1',

  // Scrollbar tokens
  '$scrollbar-width': '1.5x',
  '$scrollbar-outline-width': '1ow',
  '$scrollbar-radius': '1.5r',
  '#scrollbar-thumb': '#text.5',
  '#scrollbar-outline': '#clear',
  '#scrollbar-bg': '#surface-2',
  '#scrollbar-corner': '#clear',
};

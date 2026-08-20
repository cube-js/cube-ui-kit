import { wrapIcon } from './wrap-icon';

/**
 * Empty isometric crate — the kit's "nothing here yet" illustration.
 *
 * Drawn from the same three cube-face tokens as `LoadingAnimation`
 * (`src/tokens/palette.ts` → the isometric cube faces), so an empty table and a
 * loading table read as the same object lit the same way. Like the animation,
 * the tones ride the SVG `fill` **attribute** rather than a tasty `fill` style —
 * tasty's `fill` is a typed shorthand for `background-color`, which an SVG
 * `<path>` ignores.
 *
 * Not a `currentColor` glyph, so unlike every other icon here it does not follow
 * a `color` prop. That is the point: it is a three-tone drawing, and flattening
 * it to one tone loses the box.
 *
 * Larger in its own viewBox than the 24×24 glyph icons — the artwork is
 * full-bleed because it is used as an illustration (`size="8x"` and up) rather
 * than inline with text.
 */
export const NoDataIcon = wrapIcon(
  'NoDataIcon',
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 65 65">
    {/* Inner right wall — catches the light, same tone as the lit top face. */}
    <path
      fill="var(--loading-face-1-color)"
      d="m32.512 3.186 31.993 18.46.002 22.15-31.994-18.46z"
    />
    {/* Floor of the crate — deepest in shadow. */}
    <path
      fill="var(--loading-face-3-color)"
      d="m.518 43.798 32-18.462 31.99 18.462-31.995 18.456z"
    />
    {/* Back-left and front-right walls — the mid step. */}
    <path
      fill="var(--loading-face-2-color)"
      d="M.519 21.642 32.513 3.183l-.001 22.15L.518 43.791zM32.513 40.1l31.994-18.46-.002 22.15-31.993 18.46z"
    />
    {/* Front-left wall, with the folded-open flap. */}
    <path
      fill="var(--loading-face-1-color)"
      d="m.518 21.637 6.932 4c.59.34 1.066 1.166 1.067 1.845v5.656c0 .68.477 1.506 1.066 1.846l13.865 7.999c.589.34 1.066.064 1.066-.616v-5.655c0-.68.477-.956 1.066-.616l6.933 4 .001 22.159L.519 43.795z"
    />
  </svg>,
);

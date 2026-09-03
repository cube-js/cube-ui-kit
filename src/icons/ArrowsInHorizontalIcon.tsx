import { wrapIcon } from './wrap-icon';

/**
 * Inward horizontal arrows — the counterpart to `ArrowsHorizontalIcon`.
 *
 * Hand-authored because Tabler ships the outward pair (`IconArrowsHorizontal`,
 * `IconArrowsVertical`) but no single-axis inward twin, and pairing "reduce
 * width" with a merge or an exchange glyph reads as something else entirely.
 * Same 24×24 grid and 2px stroke as the Tabler pair it sits next to.
 */
export const ArrowsInHorizontalIcon = wrapIcon(
  'ArrowsInHorizontalIcon',
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 12h18M7 8l4 4-4 4m10-8-4 4 4 4"
    />
  </svg>,
);

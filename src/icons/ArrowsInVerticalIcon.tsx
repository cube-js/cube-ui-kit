import { wrapIcon } from './wrap-icon';

/** Inward vertical arrows. See {@link ArrowsInHorizontalIcon} for why it is local. */
export const ArrowsInVerticalIcon = wrapIcon(
  'ArrowsInVerticalIcon',
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
      d="M12 3v18M8 7l4 4 4-4M8 17l4-4 4 4"
    />
  </svg>,
);

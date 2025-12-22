import { wrapIcon } from './wrap-icon';

export const SubtotalsIcon = wrapIcon(
  'SubtotalsIcon',
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
  >
    <g fill="currentColor" opacity=".3">
      <path d="M21 21v-4H10v4zM21 12V8H10v4z" />
    </g>
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M10 3v18M3 8h18M3 17h18M3 12h18m0-7v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2"
    />
  </svg>,
);

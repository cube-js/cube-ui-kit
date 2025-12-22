import { wrapIcon } from './wrap-icon';

export const ColumnTotalIcon = wrapIcon(
  'ColumnTotalIcon',
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path fill="currentColor" d="M3 21v-4h18v4z" opacity=".3" />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M3 10h18M3 17h18M10 3v18m-5 0h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2"
    />
  </svg>,
);

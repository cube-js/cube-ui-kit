import { wrapIcon } from './wrap-icon';

export const ProgressBarIcon = wrapIcon(
  'ProgressBarIcon',
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M4 12h12M4 15h16a3 3 0 1 0 0-6H4a3 3 0 1 0 0 6"
    />
  </svg>,
);

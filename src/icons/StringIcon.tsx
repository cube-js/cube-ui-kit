import { wrapIcon } from './wrap-icon';

export const StringIcon = wrapIcon(
  'StringIcon',
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
  >
    <g
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      clipPath="url(#a)"
    >
      <path d="M14 15.5a3.5 3.5 0 1 0 7 0 3.5 3.5 0 0 0-7 0M3 19V8.5a3.5 3.5 0 1 1 7 0V19M3 13h7M21 12v7" />
    </g>
    <defs>
      <clipPath id="a">
        <path fill="#fff" d="M0 0h24v24H0z" />
      </clipPath>
    </defs>
  </svg>,
);

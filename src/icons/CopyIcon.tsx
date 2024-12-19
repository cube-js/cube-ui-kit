import { wrapIcon } from './wrap-icon';

export const CopyIcon = wrapIcon(
  'CopyIcon',
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 16 16"
  >
    <g clipPath="url(#a)">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M14.797 0C15.461 0 16 .539 16 1.203v9.03c0 .665-.539 1.204-1.203 1.204h-3.36v3.36c0 .664-.539 1.203-1.203 1.203H1.203A1.203 1.203 0 0 1 0 14.797v-9.03c0-.665.538-1.204 1.203-1.204h3.36v-3.36C4.563.539 5.102 0 5.766 0zM5.863 4.563h4.37c.665 0 1.204.539 1.204 1.203v4.37H14.7V1.3H5.863zM10.137 14.7V5.863H1.3V14.7z"
        clipRule="evenodd"
      />
    </g>
    <defs>
      <clipPath id="a">
        <path fill="#fff" d="M0 0h16v16H0z" />
      </clipPath>
    </defs>
  </svg>,
);

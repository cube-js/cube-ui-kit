import { createGlobalStyle } from '../tasty';
import { TOKENS } from '../tokens';

interface GlobalStylesProps {
  bodyStyles?: { [key: string]: string };
  fonts?: boolean;
  fontDisplay?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  publicUrl?: string;
  font?: string;
  monospaceFont?: string;
  applyLegacyTokens?: boolean;
}

interface GlobalStylesElementProps {
  $bodyStyles?: { [key: string]: string };
  $fonts?: boolean;
  $fontDisplay?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  $publicUrl?: string;
  $font?: string;
  $monospaceFont?: string;
  $applyLegacyTokens?: boolean;
}

const BODY_STYLES = {
  'overscroll-behavior-y': 'none',
  'background-color': 'white !important',
  'font-family': 'var(--font)',
  '-webkit-font-smoothing': 'antialiased',
  '-moz-osx-font-smoothing': 'grayscale',
  margin: '0',
  padding: '0',
  color: 'var(--dark-02-color)',
  'font-size': '14px',
  'line-height': '20px',
  'letter-spacing': '0.02em',
  'font-weight': '400',
};

const fontsProvider = ({ publicUrl = '', fontDisplay = 'swap' }) => `
  @font-face {
    font-family: text-security-disc;
    src: url(data:font/woff2;base64,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) format('woff2');
  }
`;

const GlobalStylesElement = createGlobalStyle<GlobalStylesElementProps>`
  body {
    ${({ $applyLegacyTokens }) => {
      return $applyLegacyTokens
        ? Object.entries(TOKENS)
            .map(([key, value]) => {
              // `inherit` value in custom property is reserved for inheritance behavior
              if (value === 'inherit') {
                // so we should rewrite it to contain the actual `inherit` value.
                value = `var(--non-existent-${key}, inherit)`;
              }

              return `--${key}: ${value};`;
            })
            .join('\n    ')
        : '';
    }}
    ${({ $bodyStyles }) => {
      return Object.entries({ ...BODY_STYLES, ...$bodyStyles })
        .map(([key, value]) => {
          return `${key}: ${value};`;
        })
        .join('\n    ');
    }}
  }

  html {
    overscroll-behavior-y: none;
    --font: ${({ $font }) =>
      $font
        ? `${$font}, `
        : ''}-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
    --monospace-font: ${({ $monospaceFont }) =>
      `${
        $monospaceFont ? `${$monospaceFont}, ` : ''
      }Menlo, Monaco, Consolas, 'Courier New', monospace;`}
  }

  kbd {
    font-family: var(--c2-font-family);
    font-weight: var(--c2-font-weight);
    font-size: var(--c2-font-size);
    border: var(--border-width) solid var(--dark-04-color);
    background-color: white;
    color: var(--dark-color);
    border-radius: var(--radius);
    padding: 0 var(--outline-width);
  }

  :not([data-qa="Icon"]) .tabler-icon {
    max-width: var(--icon-size);
    min-width: var(--icon-size);
    min-height: var(--icon-size);
    max-height: var(--icon-size);
    stroke-width: var(--stroke-width);
  }

  .cube-animation-spin {
    animation: cube-animation-spin 1s linear infinite;
  }

  @keyframes cube-animation-spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
  }

  .cube-notification-container {
    min-width: var(--min-dialog-size);
    max-width: 340px;
    width: calc(100vw - 32px);
    position: fixed;
    top: 32px;
    right: 16px;
    z-index: 999999;
  }

  .cube-notifications {
    display: grid;
    grid-auto-flow: row;
    grid-template-columns: 1fr;
  }

  .cube-notification-enter {
    opacity: 0;
    max-height: 0px;
    margin-bottom: 0px;
    transform: translate(100%, 0);
  }

  .cube-notification-enter-active {
    opacity: 1;
    max-height: 56px;
    margin-bottom: 8px;
    transform: translate(0, 0);
    transition: all 300ms ease-in;

    & > * {
      margin-bottom: 0px;
    }
  }

  .cube-notification-exit {
    opacity: 1;
    margin-bottom: 8px;
    max-height: 56px;
    transform: translate(0, 0);
  }

  .cube-notification-exit-active {
    opacity: 0;
    max-height: 0px;
    margin-bottom: 0px;
    transform: translate(100%, 0);
    transition: all 300ms ease-in;

    & > * {
      margin-bottom: 0px;
    }
  }

  b, strong {
    font-weight: var(--bold-font-weight, 700);
  }

  [type=reset], [type=submit], button, html [type=button] {
    -webkit-appearance: none;
  }

  code {
    font-family: var(--monospace-font);
  }

  ${({ $fonts, $publicUrl, $fontDisplay }) =>
    $fonts === false
      ? ''
      : fontsProvider({
          publicUrl: $publicUrl,
          ...($fontDisplay ? { fontDisplay: $fontDisplay } : {}),
        })}
    // Prism Code
  code[class*="language-"],
  pre[class*="language-"] {
    color: var(--dark-color);
    background: none;
    font-family: var(--monospace-font);
    text-align: left;
    font-weight: normal;
    font-size: 14px;
    line-height: 20px;
    white-space: pre;
    word-spacing: normal;
    word-break: normal;
    word-wrap: normal;
    border-radius: 6px;
    border: none;

    -moz-tab-size: 4;
    -o-tab-size: 4;
    tab-size: 4;

    -webkit-hyphens: none;
    -moz-hyphens: none;
    -ms-hyphens: none;
    hyphens: none;
  }

  pre[class*="language-"]::-moz-selection, pre[class*="language-"] ::-moz-selection,
  code[class*="language-"]::-moz-selection, code[class*="language-"] ::-moz-selection {
    text-shadow: none;
    background: rgb(var(--purple-color-rgb) / .2);
  }

  pre[class*="language-"]::selection, pre[class*="language-"] ::selection,
  code[class*="language-"]::selection, code[class*="language-"] ::selection {
    text-shadow: none;
    background: rgb(var(--purple-color-rgb) / .2);
  }

  @media print {
    code[class*="language-"],
    pre[class*="language-"] {
      text-shadow: none;
    }
  }

  /* Code blocks */
  pre[class*="language-"] {
    overflow: auto;
  }

  :not(pre) > code[class*="language-"],
  pre[class*="language-"] {
    background: transparent;
  }

  /* Inline code */
  :not(pre) > code[class*="language-"] {
    border-radius: .3em;
    white-space: normal;
  }

  .token.inserted-sign {
    background-color: #e6ffed;
    color: #30A666;
  }

  .token.inserted {
    color: #30A666;
  }

  .token.deleted-sign {
    background-color: #ffeef0;
    color: (--danger-color);
  }

  .token.deleted {
    color: var(--pink-color);
  }

  .token.comment,
  .token.prolog,
  .token.doctype,
  .token.cdata {
    color: var(--dark-03-color);
  }

  .token.tag,
  .token.operator,
  .token.punctuation {
    color: #993388;
  }

  .namespace {
    opacity: .7;
  }

  .token.property,
  .token.boolean,
  .token.constant,
  .token.symbol,
  .token.key,
  .token.keyword {
    color: var(--pink-color);
  }

  .token.entity,
  .token.number {
    color: #30A666;
  }

  .token.selector,
  .token.attr-name,
  .token.string,
  .token.char,
  .token.builtin {
    color: var(--purple-text-color);
  }

  .token.url,
  .language-css .token.string,
  .style .token.string {
    color: var(--dark-color);
  }

  .token.attr-value {
    color: var(--dark-color);
  }

  .token.atrule,
  .token.keyword {
    font-weight: 500;
  }

  .token.function,
  .token.class-name {
    color: var(--pink-color);
  }

  .token.regex,
  .token.important,
  .token.variable {
    color: var(--pink-color);
  }

  .token.important,
  .token.bold {
    font-weight: bold;
  }

  .token.italic {
    font-style: italic;
  }

  .token.entity {
    cursor: help;
  }
`;

export const GlobalStyles = (props: GlobalStylesProps) => {
  const newProps: GlobalStylesElementProps = {};

  Object.entries(props).forEach(([key, value]) => {
    if (value !== undefined) {
      newProps[`$${key}`] = value;
    }
  });

  return <GlobalStylesElement {...newProps} />;
};

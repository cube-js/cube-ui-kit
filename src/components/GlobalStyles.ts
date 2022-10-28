import { createGlobalStyle } from 'styled-components';

import { TOKENS } from '../tokens';

interface GlobalStylesProps {
  bodyStyles?: { [key: string]: string };
  fonts?: boolean;
  publicUrl?: string;
  font?: string;
  monospaceFont?: string;
  applyLegacyTokens?: boolean;
}

const BODY_STYLES = {
  'background-color': 'white !important',
  'font-family': 'var(--font)',
  '-webkit-font-smoothing': 'antialiased',
  '-moz-osx-font-smoothing': 'grayscale',
  margin: '0',
  padding: '0',
  color: 'rgba(20, 20, 70, .75)',
  'font-size': '14px',
  'line-height': '20px',
  'letter-spacing': '0.02em',
  'font-weight': '400',
};

const fontsProvider = ({ publicUrl = '' }) => `
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url(${publicUrl}/fonts/Inter-Regular.woff2) format('woff2'),
      url(${publicUrl}/fonts/Inter-Regular.woff) format('woff');
  }
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 500;
    font-display: swap;
    src: url(${publicUrl}/fonts/Inter-Medium.woff2) format('woff2'),
      url(${publicUrl}/fonts/Inter-Medium.woff) format('woff');
  }
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 600;
    font-display: swap;
    src: url(${publicUrl}/fonts/Inter-SemiBold.woff2) format('woff2'),
      url(${publicUrl}/fonts/Inter-SemiBold.woff) format('woff');
  }
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: url(${publicUrl}/fonts/Inter-Bold.woff2) format('woff2'),
      url(${publicUrl}/fonts/Inter-Bold.woff) format('woff');
  }
  @font-face {
    font-family: 'Source Code Pro';
    src: url('${publicUrl}/fonts/SourceCodePro-Regular.woff2') format('woff2'),
      url('${publicUrl}/fonts/SourceCodePro-Regular.woff') format('woff');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'JetBrains Mono';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url(${publicUrl}/fonts/JetBrainsMono-Regular.woff2) format('woff2'),
      url(${publicUrl}/fonts/JetBrainsMono-Regular.woff) format('woff');
  }

  @font-face {
    font-family: 'JetBrains Mono';
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: url(${publicUrl}/fonts/JetBrainsMono-Bold.woff2) format('woff2'),
      url(${publicUrl}/fonts/JetBrainsMono-Bold.woff) format('woff');
  }
`;

export const GlobalStyles = createGlobalStyle`
  body {
    ${({ applyLegacyTokens }: GlobalStylesProps) => {
      return applyLegacyTokens
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
    ${({ bodyStyles }: GlobalStylesProps) => {
      return Object.entries({ ...BODY_STYLES, ...bodyStyles })
        .map(([key, value]) => {
          return `${key}: ${value};`;
        })
        .join('\n    ');
    }}
  }

  html {
    --font: ${({ font }: GlobalStylesProps) =>
      font ||
      'Inter'}, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
    --monospace-font: ${({ monospaceFont }) =>
      `${
        monospaceFont ? `${monospaceFont}, ` : ''
      }Menlo, Monaco, Consolas, 'Courier New', monospace;}`}

  .cube-notification-container {
    min-width: 288px;
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

  ${({ fonts, publicUrl }: GlobalStylesProps) =>
    fonts === false ? '' : fontsProvider({ publicUrl })}

  // Prism Code
  code[class*="language-"],
  pre[class*="language-"] {
    color: var(--dark-color);
    background: none;
    font-family: "Source Code Pro", Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
    text-align: left;
    font-weight: normal;
    font-size: 14px;
    line-height: 20px;
    white-space: pre;
    word-spacing: normal;
    word-break: normal;
    word-wrap: normal;
    border-radius: 4px;
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
    /*background: #b3d4fc;*/
  }

  pre[class*="language-"]::selection, pre[class*="language-"] ::selection,
  code[class*="language-"]::selection, code[class*="language-"] ::selection {
    text-shadow: none;
    /*background: #b3d4fc;*/
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

  .token.comment,
  .token.prolog,
  .token.doctype,
  .token.cdata {
    color: var(--dark-04-color);
  }

  .token.keyword,
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
  .token.deleted {
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
  .token.builtin,
  .token.inserted {
    color: var(--purple-text-color);
  }

  .token.url,
  .language-css .token.string,
  .style .token.string {
    color: var(--dark-color);
  }

  .token.atrule,
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

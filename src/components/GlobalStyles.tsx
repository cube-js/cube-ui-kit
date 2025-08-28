import { useEffect } from 'react';

import { inject, keyframes } from '../tasty/injector';
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

// Helper function to convert object to CSS declarations
const objectToCSS = (obj: { [key: string]: string }): string => {
  return Object.entries(obj)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ');
};

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

// Create keyframes for animations
const createSpinKeyframes = () => {
  return keyframes(
    {
      from: 'transform: rotate(0deg)',
      to: 'transform: rotate(360deg)',
    },
    'cube-animation-spin',
  );
};

// Styled component replaced with injector-based implementation
const createGlobalStylesWithInjector = (props: {
  bodyStyles?: { [key: string]: string };
  font?: string;
  monospaceFont?: string;
}) => {
  // Section 1: CSS Custom Properties (TOKENS)
  const tokens = Object.entries(TOKENS)
    .map(([key, value]) => {
      // `inherit` value in custom property is reserved for inheritance behavior
      if (value === 'inherit') {
        // so we should rewrite it to contain the actual `inherit` value.
        value = `var(--non-existent-${key}, inherit)`;
      }
      return `--${key}: ${value};`;
    })
    .join(' ');

  // Section 2: Body styles
  const bodyDeclarations = [
    tokens,
    objectToCSS({ ...BODY_STYLES, ...props.bodyStyles }),
  ].join(' ');

  // Section 3: HTML and font styles
  const fontFamily = props.font
    ? `${props.font}, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`
    : `-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`;

  const monospaceFamily = props.monospaceFont
    ? `${props.monospaceFont}, Menlo, Monaco, Consolas, 'Courier New', monospace`
    : `Menlo, Monaco, Consolas, 'Courier New', monospace`;

  const htmlDeclarations = `overscroll-behavior-y: none; --font: ${fontFamily}; --monospace-font: ${monospaceFamily};`;

  return {
    bodyDeclarations,
    htmlDeclarations,
    fontFamily,
    monospaceFamily,
  };
};

const createElementStyles = () => [
  // Section 4: Element styles - kbd
  {
    selector: 'kbd',
    declarations: `
      font-family: var(--c2-font-family);
      font-weight: var(--c2-font-weight);
      font-size: var(--c2-font-size);
      border: var(--border-width) solid var(--dark-04-color);
      background-color: white;
      color: var(--dark-color);
      border-radius: var(--radius);
      padding: 0 var(--outline-width);
    `,
  },
  // Section 5: Icon styles
  {
    selector: ':not([data-qa="Icon"]) .tabler-icon',
    declarations: `
      max-width: var(--icon-size);
      min-width: var(--icon-size);
      min-height: var(--icon-size);
      max-height: var(--icon-size);
      stroke-width: var(--stroke-width);
    `,
  },
  // Section 6: Typography
  {
    selector: 'b, strong',
    declarations: 'font-weight: var(--bold-font-weight, 700);',
  },
  {
    selector: '[type=reset], [type=submit], button, html [type=button]',
    declarations: '-webkit-appearance: none;',
  },
  {
    selector: 'code',
    declarations: 'font-family: var(--monospace-font);',
  },
];

const createNotificationStyles = () => [
  // Section 7: Notification styles
  {
    selector: '.cube-notification-container',
    declarations: `
      min-width: var(--min-dialog-size);
      max-width: 340px;
      width: calc(100vw - 32px);
      position: fixed;
      top: 32px;
      right: 16px;
      z-index: 999999;
    `,
  },
  {
    selector: '.cube-notifications',
    declarations: `
      display: grid;
      grid-auto-flow: row;
      grid-template-columns: 1fr;
    `,
  },
  {
    selector: '.cube-notification-enter',
    declarations: `
      opacity: 0;
      max-height: 0px;
      margin-bottom: 0px;
      transform: translate(100%, 0);
    `,
  },
  {
    selector: '.cube-notification-enter-active',
    declarations: `
      opacity: 1;
      max-height: 56px;
      margin-bottom: 8px;
      transform: translate(0, 0);
      transition: all 300ms ease-in;
    `,
  },
  {
    selector: '.cube-notification-enter-active > *',
    declarations: 'margin-bottom: 0px;',
  },
  {
    selector: '.cube-notification-exit',
    declarations: `
      opacity: 1;
      margin-bottom: 8px;
      max-height: 56px;
      transform: translate(0, 0);
    `,
  },
  {
    selector: '.cube-notification-exit-active',
    declarations: `
      opacity: 0;
      max-height: 0px;
      margin-bottom: 0px;
      transform: translate(100%, 0);
      transition: all 300ms ease-in;
    `,
  },
  {
    selector: '.cube-notification-exit-active > *',
    declarations: 'margin-bottom: 0px;',
  },
];

const createFontFaceStyles = () => [
  // Section 8: Font face
  {
    selector: '@font-face',
    declarations: `
      font-family: text-security-disc;
      src: url(data:font/woff2;base64,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) format('woff2');
    `,
  },
];

const createPrismStyles = () => [
  // Section 9: Prism Code syntax highlighting
  {
    selector: 'code[class*="language-"], pre[class*="language-"]',
    declarations: `
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
    `,
  },
  {
    selector:
      'pre[class*="language-"]::-moz-selection, pre[class*="language-"] ::-moz-selection, code[class*="language-"]::-moz-selection, code[class*="language-"] ::-moz-selection',
    declarations: `
      text-shadow: none;
      background: rgb(var(--purple-color-rgb) / .2);
    `,
  },
  {
    selector:
      'pre[class*="language-"]::selection, pre[class*="language-"] ::selection, code[class*="language-"]::selection, code[class*="language-"] ::selection',
    declarations: `
      text-shadow: none;
      background: rgb(var(--purple-color-rgb) / .2);
    `,
  },
  {
    selector: 'pre[class*="language-"]',
    declarations: 'overflow: auto;',
    atRules: ['@media print'],
  },
  {
    selector: 'code[class*="language-"], pre[class*="language-"]',
    declarations: 'text-shadow: none;',
    atRules: ['@media print'],
  },
  {
    selector: ':not(pre) > code[class*="language-"], pre[class*="language-"]',
    declarations: 'background: transparent;',
  },
  {
    selector: ':not(pre) > code[class*="language-"]',
    declarations: 'border-radius: .3em; white-space: normal;',
  },
  // Token styles
  {
    selector: '.token.inserted-sign',
    declarations: 'background-color: #e6ffed; color: #30A666;',
  },
  {
    selector: '.token.inserted',
    declarations: 'color: #30A666;',
  },
  {
    selector: '.token.deleted-sign',
    declarations: 'background-color: #ffeef0; color: var(--danger-color);',
  },
  {
    selector: '.token.deleted',
    declarations: 'color: var(--pink-color);',
  },
  {
    selector: '.token.comment, .token.prolog, .token.doctype, .token.cdata',
    declarations: 'color: var(--dark-03-color);',
  },
  {
    selector: '.token.tag, .token.operator, .token.punctuation',
    declarations: 'color: #993388;',
  },
  {
    selector: '.namespace',
    declarations: 'opacity: .7;',
  },
  {
    selector:
      '.token.property, .token.boolean, .token.constant, .token.symbol, .token.key, .token.keyword',
    declarations: 'color: var(--pink-color);',
  },
  {
    selector: '.token.entity, .token.number',
    declarations: 'color: #30A666;',
  },
  {
    selector:
      '.token.selector, .token.attr-name, .token.string, .token.char, .token.builtin',
    declarations: 'color: var(--purple-text-color);',
  },
  {
    selector: '.token.url, .language-css .token.string, .style .token.string',
    declarations: 'color: var(--dark-color);',
  },
  {
    selector: '.token.attr-value',
    declarations: 'color: var(--dark-color);',
  },
  {
    selector: '.token.atrule, .token.keyword',
    declarations: 'font-weight: 500;',
  },
  {
    selector: '.token.function, .token.class-name',
    declarations: 'color: var(--pink-color);',
  },
  {
    selector: '.token.regex, .token.important, .token.variable',
    declarations: 'color: var(--pink-color);',
  },
  {
    selector: '.token.important, .token.bold',
    declarations: 'font-weight: bold;',
  },
  {
    selector: '.token.italic',
    declarations: 'font-style: italic;',
  },
  {
    selector: '.token.entity',
    declarations: 'cursor: help;',
  },
];

export const GlobalStyles = (props: GlobalStylesProps) => {
  useEffect(() => {
    // Create keyframes for animations
    const spinAnimation = createSpinKeyframes();

    // Create base styles with dynamic props
    const baseStyles = createGlobalStylesWithInjector(props);

    // Section 1 & 2: Inject body and html styles
    const bodyAndHtmlResult = inject([
      {
        selector: 'body',
        declarations: baseStyles.bodyDeclarations,
      },
      {
        selector: 'html',
        declarations: baseStyles.htmlDeclarations,
      },
    ]);

    // Section 3: Inject spin animation styles
    const spinResult = inject([
      {
        selector: '.cube-animation-spin',
        declarations: `animation: ${spinAnimation} 1s linear infinite;`,
      },
    ]);

    // Section 4-6: Inject element styles
    const elementResult = inject(createElementStyles());

    // Section 7: Inject notification styles
    const notificationResult = inject(createNotificationStyles());

    // Section 8: Inject font face styles
    const fontFaceResult = inject(createFontFaceStyles());

    // Section 9: Inject Prism syntax highlighting styles
    const prismResult = inject(createPrismStyles());

    // Cleanup function - dispose all injected styles when component unmounts
    return () => {
      spinAnimation.dispose();
      bodyAndHtmlResult.dispose();
      spinResult.dispose();
      elementResult.dispose();
      notificationResult.dispose();
      fontFaceResult.dispose();
      prismResult.dispose();
    };
  }, [props.bodyStyles, props.font, props.monospaceFont]); // Re-run when relevant props change

  // This component doesn't render anything - it only injects global styles
  return null;
};

import { parseStyle, CSSMap } from '../utils/styles';

const RESET_MAP = {
  input: [
    {
      css: `
-webkit-appearance: none;
word-spacing: initial;
-webkit-text-fill-color: currentColor;
`,
    },
    {
      $: '::-webkit-search-cancel-button',
      css: 'display: none',
    },
    {
      $: [
        ':-webkit-autofill',
        ':-webkit-autofill:hover',
        ':-webkit-autofill:focus',
      ],
      css: `
caret-color: var(--purple-color);
-webkit-text-fill-color: var(--purple-color);
-webkit-box-shadow: 0 0 0px 9999rem var(--white-color) inset;
box-shadow: 0 0 0px 9999rem var(--white-color) inset;
font-family: inherit;
font-size: inherit;
line-height: inherit;
`,
    },
    {
      $: '[disabled]',
      css: `
-webkit-opacity: 1;
`,
    },
    {
      $: '::placeholder',
      css: `
-webkit-text-fill-color: var(--local-placeholder-color);
color: var(--local-placeholder-color);
filter: saturate(.33);
`,
    },
    {
      $: '::-webkit-search-cancel-button',
      css: `
display: none;
-webkit-appearance: none;
`,
    },
    {
      $: ':not([disabled])::placeholder',
      css: '--local-placeholder-color: var(--placeholder-color, rgb(var(--dark-color-rgb) / .3));\n',
    },
  ],
  button: [
    {
      css: `
appearance: none;
touch-action: manipulation;
-webkit-tap-highlight-color: transparent;
text-decoration: none;
`,
    },
  ],
};

export function resetStyle({ reset }) {
  if (!reset) return;

  const { mods } = parseStyle(reset, 1);

  return mods.reduce((sum, mod) => {
    if (RESET_MAP[mod]) {
      sum.push(...RESET_MAP[mod]);
    }

    return sum;
  }, [] as CSSMap[]);
}

resetStyle.__lookupStyles = ['reset'];

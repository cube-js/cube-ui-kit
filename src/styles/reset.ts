import { parseStyle } from '../utils/styles';

const RESET_MAP = {
  input: [
    {
      css: `
-webkit-appearance: none;
font-family: inherit;
font-weight: inherit;
word-spacing: initial;
-webkit-text-fill-color: currentColor;
box-sizing: border-box;
user-select: auto;
resize: none;
transition: opacity var(--transition) linear;
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
caret-color: var(--special-color);
-webkit-text-fill-color: var(--special-color);
-webkit-box-shadow: 0 0 0px 9999rem var(--input-color) inset;
box-shadow: 0 0 0px 9999rem var(--input-color) inset;
font-family: inherit;
font-size: inherit;
line-height: inherit;
`,
    },
    {
      $: '[disabled]',
      css: `
color: inherit;
background: transparent;
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
      css: '--local-placeholder-color: var(--placeholder-color, rgba(var(--text-color-rgb), .5));\n',
    },
  ],
  button: [
    {
      css: `
transition: all var(--transition) linear;
background: transparent;
border: none;
outline: none;
appearance: none;
position: relative;
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
  }, []);
}

resetStyle.__lookupStyles = ['reset'];

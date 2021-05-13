import { parseStyle } from '../utils/styles';

const RESET_MAP = {
  input: `
    -webkit-appearance: none;
    font-family: inherit;
    font-weight: inherit;
    text-align: inherit;
    word-spacing: initial;
    -webkit-text-fill-color: currentColor;
    box-sizing: border-box;
    user-select: auto;
    resize: none;
    transition: opacity var(--transition) linear;

    &::-webkit-search-cancel-button {
      display: none;
    }

    &:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus {
      caret-color: var(--special-color);
      -webkit-text-fill-color: var(--special-color);
      -webkit-box-shadow: 0 0 0px 9999rem var(--input-color) inset;
      box-shadow: 0 0 0px 9999rem var(--input-color) inset;
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
    }

    &[disabled] {
      color: inherit;
      background: transparent;
      -webkit-opacity: 1;
    }

    &::placeholder {
      -webkit-text-fill-color: var(--local-placeholder-color);
      color: var(--local-placeholder-color);
      filter: saturate(.33);
    }
    
    &::-webkit-search-cancel-button {
      display: none;
      -webkit-appearance: none;
    }
    
    &:not([disabled])::placeholder {
      --local-placeholder-color: var(--placeholder-color, rgba(var(--text-color-rgb), .5));
    }
  `,
  button: `
    transition: all var(--transition) linear;
    background: transparent;
    border: none;
    outline: none;
    appearance: none;
    position: relative;
    touch-action: manipulation;
    -webkit-tap-highlight-color: var(--mark-color);
  `,
};

export default function resetStyle({ reset }) {
  if (!reset) return '';

  const { mods } = parseStyle(reset, 2);

  return mods.reduce((sum, mod) => {
    if (RESET_MAP[mod]) {
      sum += RESET_MAP[mod];
      sum += '\n\n';
    }

    return sum;
  }, '');
}

resetStyle.__styleLookup = ['reset'];

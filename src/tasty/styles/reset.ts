import { parseStyle } from '../utils/styles';

const AUTOFILL_STYLES = {
  'caret-color': 'var(--purple-color)',
  '-webkit-text-fill-color': 'var(--purple-color)',
  '-webkit-box-shadow': '0 0 0px 9999rem var(--white-color) inset',
  'box-shadow': '0 0 0px 9999rem var(--white-color) inset',
  'font-family': 'inherit',
  'font-size': 'inherit',
  'line-height': 'inherit',
};

const RESET_MAP = {
  input: [
    {
      '-webkit-appearance': 'none',
      'word-spacing': 'initial',
      '-webkit-text-fill-color': 'currentColor',
    },
    {
      $: '::-webkit-search-cancel-button',
      display: 'none',
    },
    {
      $: ':-webkit-autofill',
      ...AUTOFILL_STYLES,
    },
    {
      $: ':-webkit-autofill:hover',
      ...AUTOFILL_STYLES,
    },
    {
      $: ':-webkit-autofill:focus',
      ...AUTOFILL_STYLES,
    },
    {
      $: '[disabled]',
      '-webkit-opacity': '1',
    },
    {
      $: '::placeholder',
      '-webkit-text-fill-color': 'var(--local-placeholder-color)',
      color: 'var(--local-placeholder-color)',
      filter: 'saturate(.33)',
    },
    {
      $: '::-webkit-search-cancel-button',
      display: 'none',
      '-webkit-appearance': 'none',
    },
    {
      $: ':not([disabled])::placeholder',
      '--local-placeholder-color':
        'var(--placeholder-color, rgb(var(--dark-color-rgb) / .3))',
    },
  ],
  button: [
    {
      appearance: 'none',
      'touch-action': 'manipulation',
      '-webkit-tap-highlight-color': 'transparent',
      'text-decoration': 'none',
    },
  ],
};

export function resetStyle({ reset }) {
  if (!reset) return;

  const processed = parseStyle(reset);
  const { mods } = processed.groups[0] ?? ({ mods: [] } as any);

  const result: any[] = [];

  for (const mod of mods) {
    if (RESET_MAP[mod]) {
      result.push(...RESET_MAP[mod]);
    }
  }

  return result.length ? result : undefined;
}

resetStyle.__lookupStyles = ['reset'];

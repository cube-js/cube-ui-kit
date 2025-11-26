const colors = {
  pink: '255 100 146',
  'pink-02': '255 131 168',
  purple: '113 110 238',
  'purple-text': '105 103 227',
  'purple-bg': '241 239 250',
  'purple-icon': '142, 134, 237',
  'purple-01': '122 119 255',
  'purple-02': '149 146 255',
  'purple-03': '175 173 255',
  'purple-04': '202 201 255',
  focus: '172 163 238',
  text: '91 92 125',
  dark: '25 26 46',
  'dark-01': '25 26 46',
  'dark-02': '69 68 98',
  'dark-03': '115 114 139',
  'dark-04': '161 161 178',
  'dark-05': '213 213 222',
  'dark-bg': '249 249 251',
  light: '246 246 248',
  white: '255 255 255',
  black: '0 0 0',
  danger: '227 70 75',
  'danger-text': '208 57 56',
  'danger-bg': '253 245 244',
  'danger-icon': '245 101 99',
  success: '9 145 88',
  'success-text': '12 135 82',
  'success-icon': '40 165 104',
  'success-bg': '238 249 242',
  note: '158 119 19',
  'note-text': '150 112 8',
  'note-bg': '253 245 233',
  'note-icon': '181 140 44',
  border: '227 227 233',
  // 'light-border': '237 237 240',
  'light-border': '227 227 233', // deprecated
};

export const SIZES = {
  XS: 24,
  SM: 28,
  MD: 32,
  LG: 40,
  XL: 48,
};

export const SIZES_MAP = {
  xsmall: 'XS',
  small: 'SM',
  medium: 'MD',
  large: 'LG',
  xlarge: 'XL',
};

function color(name, opacity = 1) {
  return `rgb(${colors[name]} / ${opacity})`;
}

const TOKENS = {
  // Base and legacy tokens
  'font-size': '14px',
  'line-height': '20px',
  'input-font-size': '14px',
  'input-line-height': '20px',
  'input-letter-spacing': '0.02em',
  'disabled-opacity': '.4',
  gap: '8px',
  'stroke-width': 1.5,
  'outline-width': 'calc(1rem / 16 * 3)',
  'border-width': '1px',
  radius: '6px',
  'large-radius': '(1r + .5x)',
  'card-radius': '(1r + .5x)',
  'leaf-sharp-radius': '0px',
  'fade-width': '32px',
  transition: '80ms',
  'disclosure-transition': '120ms',
  'min-dialog-size': 'min(288px, calc(100vw - (2 * var(--gap))))',
  'clear-color': 'transparent',
  'border-opaque-color': 'rgb(227 227 233)',
  'shadow-color': color('dark', 0.06),
  'draft-color': color('dark', 0.2),
  'minor-color': color('dark', 0.65),
  'danger-bg-hover-color': color('danger', 0.1),
  'dark-75-color': color('dark', 0.75),
  'primary-color': color('purple'),

  'pink-8-color': color('pink', 0.2),
  'pink-9-color': color('pink', 0.1),

  'disabled-color': color('dark-01', 0.25),
  'disabled-text-color': color('dark-01', 0.25),
  'disabled-bg-color': color('dark-05', 0.2),

  'max-content-width': '1440px',
  'topbar-height': '48px',
  'devmodebar-height': '54px',
  'sidebar-width': '200px',
  'border-radius-base': '4px',

  // shadows
  'item-shadow': '0 1bw .375x #dark.15',
  'card-shadow': '0 .5x 2x #shadow',
  'dialog-shadow': '0 1x 4x #dark.15',

  // button/input sizes
  'size-xs': `${SIZES.XS}px`,
  'size-sm': `${SIZES.SM}px`,
  'size-md': `${SIZES.MD}px`,
  'size-lg': `${SIZES.LG}px`,
  'size-xl': `${SIZES.XL}px`,

  // space sizes
  'space-xs': '.5x',
  'space-sm': '.75x',
  'space-md': '1x',
  'space-lg': '1.5x',
  'space-xl': '2x',

  // font sizes
  'text-font-size': '14px',
  'text-line-height': '20px',
  'text-letter-spacing': '0',
  // h1
  'h1-font-size': '36px',
  'h1-line-height': '44px',
  'h1-letter-spacing': '-0.01em',
  'h1-font-weight': '600',
  'h1-bold-font-weight': '700',
  'h1-icon-size': '40px',
  // h2
  'h2-font-size': '24px',
  'h2-line-height': '32px',
  'h2-letter-spacing': '0em',
  'h2-font-weight': '600',
  'h2-bold-font-weight': '700',
  'h2-icon-size': '28px',
  // h3
  'h3-font-size': '20px',
  'h3-line-height': '28px',
  'h3-letter-spacing': '0em',
  'h3-font-weight': '600',
  'h3-bold-font-weight': '700',
  'h3-icon-size': '24px',
  // h4
  'h4-font-size': '18px',
  'h4-line-height': '24px',
  'h4-letter-spacing': '0',
  'h4-font-weight': '600',
  'h4-bold-font-weight': '700',
  'h4-icon-size': '22px',
  // h5
  'h5-font-size': '16px',
  'h5-line-height': '22px',
  'h5-letter-spacing': '0',
  'h5-font-weight': '600',
  'h5-bold-font-weight': '700',
  'h5-icon-size': '20px',
  // h6
  'h6-font-size': '14px',
  'h6-line-height': '20px',
  'h6-letter-spacing': '0.01em',
  'h6-font-weight': '600',
  'h6-bold-font-weight': '700',
  'h6-icon-size': '20px',
  // t1
  't1-font-size': '18px',
  't1-line-height': '24px',
  't1-letter-spacing': '0',
  't1-font-weight': '400',
  't1-icon-size': '20px',
  // t2
  't2-font-size': '16px',
  't2-line-height': '22px',
  't2-letter-spacing': '0',
  't2-font-weight': '400',
  't2-icon-size': '20px',
  // t2m
  't2m-font-size': '16px',
  't2m-line-height': '22px',
  't2m-letter-spacing': '0',
  't2m-font-weight': '500',
  't2m-icon-size': '20px',
  // t3
  't3-font-size': '14px',
  't3-line-height': '20px',
  't3-letter-spacing': '0',
  't3-font-weight': '400',
  't3-icon-size': '18px',
  // t3m
  't3m-font-size': '14px',
  't3m-line-height': '20px',
  't3m-letter-spacing': '0',
  't3m-font-weight': '500',
  't3m-icon-size': '18px',
  // t4
  't4-font-size': '12px',
  't4-line-height': '18px',
  't4-letter-spacing': '0',
  't4-font-weight': '500',
  't4-icon-size': '16px',
  // t4m
  't4m-font-size': '12px',
  't4m-line-height': '18px',
  't4m-letter-spacing': '0',
  't4m-font-weight': '600',
  't4m-bold-font-weight': '700',
  't4m-icon-size': '16px',
  // m1
  'm1-font-size': '18px',
  'm1-line-height': '32px',
  'm1-letter-spacing': '0',
  'm1-font-weight': '400',
  'm1-icon-size': '22px',
  // m2
  'm2-font-size': '16px',
  'm2-line-height': '28px',
  'm2-letter-spacing': '0',
  'm2-font-weight': '400',
  'm2-icon-size': '20px',
  // m2
  'm3-font-size': '14px',
  'm3-line-height': '24px',
  'm3-letter-spacing': '0',
  'm3-font-weight': '400',
  'm3-icon-size': '20px',
  // p1
  'p1-font-size': '18px',
  'p1-line-height': '28px',
  'p1-letter-spacing': '0',
  'p1-font-weight': '400',
  'p1-icon-size': '22px',
  // p2
  'p2-font-size': '16px',
  'p2-line-height': '24px',
  'p2-letter-spacing': '0',
  'p2-font-weight': '400',
  'p2-icon-size': '20px',
  // p3
  'p3-font-size': '14px',
  'p3-line-height': '22px',
  'p3-letter-spacing': '0',
  'p3-font-weight': '400',
  'p3-icon-size': '18px',
  // p4
  'p4-font-size': '12px',
  'p4-line-height': '20px',
  'p4-letter-spacing': '0',
  'p4-font-weight': '500',
  'p4-icon-size': '16px',
  // c1
  'c1-font-size': '14px',
  'c1-line-height': '20px',
  'c1-letter-spacing': '0',
  'c1-font-weight': '600',
  'c1-font-bold-weight': '700',
  'c1-text-transform': 'uppercase',
  'c1-icon-size': '18px',
  // c2
  'c2-font-size': '12px',
  'c2-line-height': '18px',
  'c2-letter-spacing': '0.01em',
  'c2-font-weight': '600',
  'c2-font-bold-weight': '700',
  'c2-text-transform': 'uppercase',
  'c2-icon-size': '16px',
  // tag
  'tag-font-size': '12px',
  'tag-line-height': '18px',
  'tag-letter-spacing': '0.01em',
  'tag-font-weight': '600',
  'tag-bold-font-weight': '700',
  'tag-icon-size': '16px',
  // strong
  'strong-font-size': 'inherit',
  'strong-line-height': 'inherit',
  'strong-letter-spacing': 'inherit',
  'strong-font-family': 'inherit',
  'strong-font-style': 'inherit',
  'strong-font-weight':
    'var(--bold-font-weight, var(--default-bold-font-weight, 600))',
  // em
  'em-font-size': 'inherit',
  'em-line-height': 'inherit',
  'em-letter-spacing': 'inherit',
  'em-font-family': 'inherit',
  'em-font-style': 'italic',
  'em-font-weight': 'inherit',
  // default
  'default-font-size': 'var(--t3-font-size)',
  'default-line-height': 'var(--t3-line-height)',
  'default-letter-spacing': 'var(--t3-letter-spacing)',
  'default-font-weight': 'var(--t3-font-weight)',
  'default-bold-font-weight': '600',
  'default-icon-size': 'inherit',
  // scrollbar colors
  'scrollbar-width': '1.5x',
  'scrollbar-outline-width': '1ow',
  'scrollbar-radius': '1.5r',
  'scrollbar-thumb-color': 'rgb(var(--text-color-rgb) / .5)',
  'scrollbar-outline-color': 'var(--clear-color)',
  'scrollbar-bg-color': 'var(--dark-bg-color)',
  'scrollbar-corner-color': 'var(--clear-color)',
};

// Map color tokens
Object.keys(colors).forEach((name) => {
  TOKENS[`${name}-color`] = color(name);
  TOKENS[`${name}-color-rgb`] = colors[name];
});

export { TOKENS };

const colors = {
  pink: '255, 100, 146',
  'pink-02': '255, 131, 168',
  purple: '122, 119, 255',
  'purple-text': '102, 93, 232',
  'purple-01': '122, 119, 255',
  'purple-02': '149, 146, 255',
  'purple-03': '175, 173, 255',
  'purple-04': '202, 201, 255',
  text: '91, 92, 125',
  dark: '20, 20, 70',
  'dark-01': '20, 20, 70',
  'dark-02': '67, 67, 107',
  'dark-03': '114, 114, 144',
  'dark-04': '161, 161, 181',
  'dark-05': '213, 213, 226',
  'grey-light': '248, 248, 249',
  light: '246, 246, 248',
  white: '255, 255, 255',
  black: '0, 0, 0',
  'danger-text': '239, 64, 74',
  danger: '255, 100, 109',
  'light-grey': '248, 248, 249',
  success: '49, 195, 124',
  'success-text': '48, 166, 102',
  note: '251, 188, 5',
};

function color(name, opacity = 1) {
  return `rgba(${colors[name]}, ${opacity})`;
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
  'outline-width': 'calc(1rem / 16 * 3)',
  'border-width': '1px',
  radius: '4px',
  'leaf-sharp-radius': '0px',
  transition: '120ms',
  'clear-color': 'transparent',
  'border-color': color('dark', 0.1),
  'shadow-color': color('dark-03', 0.1),
  'draft-color': color('dark', 0.2),
  'minor-color': color('dark', 0.65),
  'success-bg-color': 'rgba(41, 190, 110, .1)',
  'note-bg-color': color('note', 0.1),
  'note-text-color': color('dark', 0.65),
  'danger-bg-color': color('danger', 0.05),
  'danger-bg-hover-color': color('danger', 0.1),
  'primary-1': color('purple', 0.9),
  'primary-2': color('purple', 0.8),
  'primary-3': color('purple', 0.7),
  'primary-4': color('purple', 0.6),
  'primary-5': color('purple', 0.5),
  'primary-6': color('purple', 0.4),
  'primary-7': color('purple', 0.3),
  'primary-8': color('purple', 0.2),
  'primary-9': color('purple', 0.1),
  'primary-10': color('purple', 0),
  'dark-75-color': color('dark', 0.75),
  'primary-color': color('purple'),

  'pink-8-color': color('pink', 0.2),
  'pink-9-color': color('pink', 0.1),

  'disabled-color': color('dark-01', 0.25),
  'disabled-text-color': color('dark-01', 0.25),
  'disabled-bg': color('dark-05', 0.2),
  'disabled-bg-color': color('dark-05', 0.2),

  'max-content-width': '1440px',
  'topbar-height': '48px',
  'devmodebar-height': '54px',
  'sidebar-width': '200px',
  'border-radius-base': '4px',

  // font sizes
  'text-font-size': '14px',
  'text-line-height': '20px',
  'text-letter-spacing': '0.02em',
  // h1
  'h1-font-size': '36px',
  'h1-line-height': '44px',
  'h1-letter-spacing': '-0.01em',
  'h1-font-weight': '700',
  // h2
  'h2-font-size': '24px',
  'h2-line-height': '36px',
  'h2-letter-spacing': '0em',
  'h2-font-weight': '700',
  // h3
  'h3-font-size': '20px',
  'h3-line-height': '28px',
  'h3-letter-spacing': '0em',
  'h3-font-weight': '700',
  // h4
  'h4-font-size': '18px',
  'h4-line-height': '24px',
  'h4-letter-spacing': '0.01em',
  'h4-font-weight': '700',
  // h5
  'h5-font-size': '16px',
  'h5-line-height': '22px',
  'h5-letter-spacing': '0.02em',
  'h5-font-weight': '700',
  // h5 semi-bold
  'h5s-font-size': '16px',
  'h5s-line-height': '22px',
  'h5s-letter-spacing': '0.02em',
  'h5s-font-weight': '600',
  // h5 medium
  'h5m-font-size': '16px',
  'h5m-line-height': '22px',
  'h5m-letter-spacing': '0.02em',
  'h5m-font-weight': '500',
  // h6 (unused)
  'h6-font-size': '14px',
  'h6-line-height': '20px',
  'h6-font-weight': '700',
  // t1
  't1-font-size': '18px',
  't1-line-height': '24px',
  't1-letter-spacing': '0',
  't1-font-weight': '400',
  // t2
  't2-font-size': '16px',
  't2-line-height': '22px',
  't2-letter-spacing': '0.01em',
  't2-font-weight': '400',
  // t3
  't3-font-size': '14px',
  't3-line-height': '20px',
  't3-letter-spacing': '0.02em',
  't3-font-weight': '400',
  // t3m
  't3m-font-size': '14px',
  't3m-line-height': '20px',
  't3m-letter-spacing': '0.015em',
  't3m-font-weight': '500',
  // t4
  't4-font-size': '12px',
  't4-line-height': '18px',
  't4-letter-spacing': '0.025em',
  't4-font-weight': '400',
  // t4m
  't4m-font-size': '12px',
  't4m-line-height': '18px',
  't4m-letter-spacing': '0.02em',
  't4m-font-weight': '500',
  // p1
  'p1-font-size': '18px',
  'p1-line-height': '28px',
  'p1-letter-spacing': '0',
  'p1-font-weight': '400',
  // p2
  'p2-font-size': '16px',
  'p2-line-height': '24px',
  'p2-letter-spacing': '0.01em',
  'p2-font-weight': '400',
  // p3
  'p3-font-size': '14px',
  'p3-line-height': '22px',
  'p3-letter-spacing': '0.02em',
  'p3-font-weight': '400',
  // p4
  'p4-font-size': '12px',
  'p4-line-height': '20px',
  'p4-letter-spacing': '0.025em',
  'p4-font-weight': '400',
  // c1
  'c1-font-size': '14px',
  'c1-line-height': '20px',
  'c1-letter-spacing': '0.015em',
  'c1-font-weight': '500',
  'c1-text-transform': 'uppercase',
  // c2
  'c2-font-size': '12px',
  'c2-line-height': '18px',
  'c2-letter-spacing': '0.02em',
  'c2-font-weight': '500',
  'c2-text-transform': 'uppercase',
  // tag
  'tag-font-size': '12px',
  'tag-line-height': '12px',
  'tag-letter-spacing': '0.02em',
  'tag-font-weight': '500',
  // strong
  'strong-font-size': 'inherit',
  'strong-line-height': 'inherit',
  'strong-letter-spacing': 'inherit',
  'strong-font-family': 'inherit',
  'strong-font-style': 'inherit',
  'strong-font-weight': 600,
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
};

// Map color tokens
Object.keys(colors).forEach((name) => {
  TOKENS[`${name}-color`] = color(name);
  TOKENS[`${name}-color-rgb`] = colors[name];
});

export { TOKENS };

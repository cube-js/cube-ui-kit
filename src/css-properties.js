const colors = {
  pink: '255, 100, 146',
  purple: '122, 119, 255',
  'purple-01': '122, 119, 255',
  'purple-03': '175, 173, 255',
  'purple-04': '202, 201, 255',
  text: '91, 92, 125',
  dark: '20, 20, 70',
  'dark-01': '20, 20, 70',
  'dark-02': '67, 67, 107',
  'dark-03': '114, 114, 144',
  'dark-04': '161, 161, 181',
  'dark-05': '213, 213, 226',
  light: '243, 243, 251',
  white: '255, 255, 255',
  black: '0, 0, 0',
};

function color(name, opacity = 1) {
  return `rgba(${colors[name]}, ${opacity})`;
}

const PROPS = {
  'font-size': '14px',
  'line-height': '22px',
  'input-font-size': '16px',
  'input-line-height': '22px',
  gap: '.5rem',
  radius: '.25rem',
  'border-width': '1px',
  'outline-width': 'calc(1rem / 16 * 3)',
  'border-color': color('dark', 0.1),
  'shadow-color': color('dark-03', 0.05),
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
  'dark-65-color': color('dark', 0.65),
  'primary-color': color('purple'),
  'max-content-width': '1440px',
  'topbar-height': '48px',
  'page-content-min-height': 'calc(100vh - var(--topbar-height))',
  'sidebar-width': '200px',
};

Object.keys(colors).forEach((name) => {
  PROPS[`${name}-color`] = color(name);
  PROPS[`${name}-color-rgb`] = colors[name];
});

export default PROPS;

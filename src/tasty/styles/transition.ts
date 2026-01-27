import { parseStyle } from '../utils/styles';

const SECOND_FILL_COLOR_PROPERTY = '--tasty-second-fill-color';

const MAP = {
  fade: ['mask', 'mask-composite'],
  translate: ['transform', 'translate'],
  rotate: ['transform', 'rotate'],
  scale: ['transform', 'scale'],
  fill: ['background-color', 'background-image', SECOND_FILL_COLOR_PROPERTY],
  image: [
    'background-image',
    'background-position',
    'background-size',
    'background-repeat',
    'background-attachment',
    'background-origin',
    'background-clip',
    SECOND_FILL_COLOR_PROPERTY,
  ],
  background: [
    'background-color',
    'background-image',
    'background-position',
    'background-size',
    'background-repeat',
    'background-attachment',
    'background-origin',
    'background-clip',
    SECOND_FILL_COLOR_PROPERTY,
  ],
  border: [
    'border',
    'border-top',
    'border-right',
    'border-bottom',
    'border-left',
  ],
  filter: ['filter', 'backdrop-filter'],
  radius: ['border-radius'],
  shadow: ['box-shadow'],
  outline: ['outline', 'outline-offset'],
  preset: [
    'font-size',
    'line-height',
    'letter-spacing',
    'font-weight',
    'font-style',
  ],
  text: ['font-weight', 'text-decoration-color'],
  color: ['color'],
  opacity: ['opacity'],
  theme: [
    'color',
    'background-color',
    'background-image',
    'box-shadow',
    'border',
    'border-radius',
    'outline',
    'opacity',
    SECOND_FILL_COLOR_PROPERTY,
  ],
  width: ['max-width', 'min-width', 'width'],
  height: ['max-height', 'min-height', 'height'],
  gap: ['gap', 'margin'],
  zIndex: ['z-index'],
  inset: ['inset', 'top', 'right', 'bottom', 'left'],
};

export const DEFAULT_TIMING = 'var(--transition)';
const DEFAULT_EASING = 'linear';

function getTiming(name) {
  return `var(--${name}-transition, var(--transition))`;
}

export function transitionStyle({ transition }) {
  if (!transition) return;

  const processed = parseStyle(transition);
  const tokens: string[] = [];
  processed.groups.forEach((g, idx) => {
    tokens.push(...g.all);
    if (idx < processed.groups.length - 1) tokens.push(',');
  });

  if (!tokens) return;

  let tempTransition: string[] = [];
  const transitions: string[][] = [];

  tokens.forEach((token) => {
    if (token === ',') {
      if (tempTransition) {
        transitions.push(tempTransition);
        tempTransition = [];
      }
    } else {
      tempTransition.push(token);
    }
  });

  if (tempTransition) {
    transitions.push(tempTransition);
  }

  const map: {
    name?: string;
    easing?: string;
    timing?: string;
    delay?: string;
  } = {};

  transitions.forEach((transition) => {
    const name = transition[0];
    const timing = transition[1];
    const easing = transition[2];
    const delay = transition[3];

    const styles = MAP[name] || [name];

    styles.forEach((style) => {
      map[style] = [name, easing, timing, delay];
    });
  });

  const result = Object.entries(map)
    .map(([style, [name, easing, timing, delay]]) => {
      let value = `${style} ${timing || getTiming(name)}`;
      if (easing || delay) {
        value += ` ${easing || DEFAULT_EASING}`;
      }
      if (delay) {
        value += ` ${delay}`;
      }
      return value;
    })
    .join(', ');

  return { transition: result };
}

transitionStyle.__lookupStyles = ['transition'];

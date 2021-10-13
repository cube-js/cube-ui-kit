const MAP = {
  move: ['transform'],
  rotate: ['transform'],
  scale: ['transform'],
  placeSelf: ['transform', 'top', 'right', 'bottom', 'left'],
  fill: ['background-color'],
  border: ['border', 'box-shadow'],
  filter: ['filter', 'backdrop-filter'],
  radius: ['border-radius'],
  shadow: ['box-shadow'],
  outline: ['box-shadow'],
  preset: [
    'font-size',
    'line-height',
    'letter-spacing',
    'font-weight',
    'font-style',
  ],
  text: ['font-weight', 'text-decoration-color'],
  theme: ['color', 'background-color', 'box-shadow', 'border', 'border-radius'],
  inset: ['box-shadow'],
  mark: ['box-shadow'],
  width: ['max-width', 'min-width', 'width'],
  height: ['max-height', 'min-height', 'height'],
  gap: ['gap', 'margin'],
  zIndex: ['z-index'],
  image: ['background-image', 'background-position', 'background-size'],
};

export const DEFAULT_TIMING = 'var(--transition)';
const DEFAULT_EASING = 'linear';

function getTiming(name) {
  return `var(--${name}-transition, var(--transition))`;
}

const TRANSITION_REGEXP = /([.0-9ms]+)|([a-z0-9-]+\(.+?\))|([a-z0-9-]+)|(,)/gi;

export function transitionStyle({ transition }) {
  if (!transition) return;

  const tokens = transition.match(TRANSITION_REGEXP);

  if (!tokens) return;

  let tempTransition = '';
  const transitions: string[] = [];

  tokens.forEach((token) => {
    if (token === ',') {
      if (tempTransition) {
        transitions.push(tempTransition);
        tempTransition = '';
      }
    } else {
      tempTransition += ` ${token}`;
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
    const temp = transition.match(TRANSITION_REGEXP);

    if (!temp) return;

    const name = temp[0];
    const timing = temp[1];
    const easing = temp[2];
    const delay = temp[3];

    const styles = MAP[name] || [name];

    styles.forEach((style) => {
      map[style] = [name, easing, timing, delay];
    });
  });

  const result = Object.entries(map)
    .map(([style, [name, easing, timing, delay]]) => {
      return `${style}  ${timing || getTiming(name)} ${
        easing || DEFAULT_EASING
      } ${delay || '0s'}`;
    })
    .join(', ');

  return { transition: result };
}

transitionStyle.__lookupStyles = ['transition'];

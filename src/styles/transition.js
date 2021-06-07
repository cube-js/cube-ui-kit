import { isNoValue, parseStyle } from '../utils/styles';

const MAP = {
  move: ['transform'],
  rotate: ['transform'],
  scale: ['transform'],
  place: ['transform', 'top', 'right', 'bottom', 'left'],
  fill: ['background-color'],
  border: ['border', 'box-shadow'],
  filter: ['filter', 'backdrop-filter'],
  radius: ['border-radius'],
  shadow: ['box-shadow'],
  outline: ['box-shadow'],
  size: ['font-size', 'line-height'],
  text: ['font-weight', 'text-decoration-color'],
  theme: ['color', 'background-color', 'box-shadow', 'border', 'border-radius'],
  inset: ['box-shadow'],
  mark: ['box-shadow'],
  width: ['max-width', 'min-width', 'width'],
  height: ['max-height', 'min-height', 'height'],
  gap: ['gap', 'margin'],
  z: ['z-index'],
  image: ['background-image', 'background-position', 'background-size'],
};

export const DEFAULT_TIMING = 'var(--transition)';
const DEFAULT_EASING = 'linear';

function getTiming(name) {
  return `var(--${name}-transition, var(--transition))`;
}

export function transitionStyle({ transition }) {
  if (transition == null || isNoValue(transition)) return;

  const transitions = transition.split(',');
  const map = {};

  transitions.forEach((transition) => {
    const { values, mods } = parseStyle(transition);
    const name = mods[0];
    const easing = mods[1];
    const timing = values[0];

    const styles = MAP[name] || [name];

    styles.forEach((style) => {
      map[style] = [timing, easing, name];
    });
  });

  const result = Object.entries(map)
    .map(([style, [timing, easing, name]]) => {
      return `${style} ${timing || getTiming(name)} ${
        easing || DEFAULT_EASING
      }`;
    })
    .join(', ');

  return { transition: result };
}

transitionStyle.__lookupStyles = ['transition'];

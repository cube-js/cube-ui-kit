import { transferMods, parseStyle, createRule } from '../utils/styles';

const DEFAULT_MIN_SIZE = 'var(--gap)';
const DEFAULT_MAX_SIZE = '100%';

function isSizingSupport(val) {
  return CSS.supports('height', val);
}

const STRETCH = 'stretch';
const FILL_AVAILABLE = 'fill-available';
const WEBKIT_FILL_AVAILABLE = '-webkit-fill-available';
const MOZ_FILL_AVAILABLE = '-moz-fill-available';
const STRETCH_SIZE = isSizingSupport(STRETCH)
  ? STRETCH
  : isSizingSupport(FILL_AVAILABLE)
  ? FILL_AVAILABLE
  : isSizingSupport(WEBKIT_FILL_AVAILABLE)
  ? WEBKIT_FILL_AVAILABLE
  : isSizingSupport(MOZ_FILL_AVAILABLE)
  ? MOZ_FILL_AVAILABLE
  : null;
const INTRINSIC_MODS = ['max-content', 'min-content', 'fit-content', 'stretch'];

export default function dimensionStyle(name) {
  const minStyle = `min-${name}`;
  const maxStyle = `max-${name}`;

  return (val) => {
    if (!val) return '';

    const styles = {
      [name]: 'auto',
      [minStyle]: 'auto',
      [maxStyle]: 'initial',
    };

    const { mods, values } = parseStyle(val, 1);

    transferMods(INTRINSIC_MODS, mods, values);

    values.forEach((v, i) => {
      if (v === 'stretch') {
        values[i] = STRETCH_SIZE || (name === 'height' ? '100vh' : '100vw');
      }
    });

    let flag = false;

    for (let mod of mods) {
      switch (mod) {
        case 'min':
          styles[minStyle] = values[0] || DEFAULT_MIN_SIZE;
          flag = true;
          break;
        case 'max':
          styles[maxStyle] = values[0] || DEFAULT_MAX_SIZE;
          flag = true;
          break;
        default:
          break;
      }
    }

    if (!flag || !mods.length) {
      if (values.length === 2) {
        styles[minStyle] = values[0];
        styles[maxStyle] = values[1];
      } else if (values.length === 3) {
        styles[minStyle] = values[0];
        styles[name] = values[1];
        styles[maxStyle] = values[2];
      } else {
        styles[name] = values[0] || 'auto';
      }
    }

    return Object.keys(styles).reduce(
      (css, style) => css + createRule(style, styles[style]),
      '',
    );
  };
}

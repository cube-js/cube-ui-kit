import { parseStyle } from '../utils/styles';

const DEFAULT_MIN_SIZE = 'var(--gap)';
const DEFAULT_MAX_SIZE = '100%';

export function dimensionStyle(name) {
  const minStyle = `min-${name}`;
  const maxStyle = `max-${name}`;

  return (val) => {
    if (val === true) {
      return {
        [name]: 'auto',
        [minStyle]: 'initial',
        [maxStyle]: 'initial',
      };
    }

    if (!val) return '';

    if (typeof val === 'number') {
      val = `${val}px`;
    }

    val = String(val);

    const styles: Record<string, string | string[]> = {
      [name]: 'auto',
      [minStyle]: 'initial',
      [maxStyle]: 'initial',
    };

    const processed = parseStyle(val);
    const { mods, values } =
      processed.groups[0] ?? ({ mods: [], values: [] } as any);

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

    if (styles[name] === 'stretch') {
      if (name === 'width') {
        styles[name] = ['stretch', '-webkit-fill-available', '-moz-available'];
      } else {
        styles[name] = 'auto';
      }
    }

    return styles;
  };
}

import { parseStyle } from '../utils/styles';

export function scrollbarStyle({
  scrollbar,
  overflow,
}: {
  scrollbar?: string | boolean | number;
  overflow?: string;
}) {
  // Check if scrollbar is defined
  if (!scrollbar && scrollbar !== 0) return;

  // Support true as alias for thin
  let value = scrollbar === true ? 'thin' : scrollbar;
  const { mods, colors, values } = parseStyle(String(value));
  const style = {};

  style['scrollbar-color'] = 'var(--scrollbar-thumb-color) transparent';

  // Modifiers
  if (mods.includes('thin')) {
    style['scrollbar-width'] = 'thin';
  }
  if (mods.includes('none')) {
    style['scrollbar-width'] = 'none';
    style['scrollbar-color'] = 'transparent transparent';
  }
  if (mods.includes('auto')) {
    style['scrollbar-width'] = 'auto';
  }
  if (mods.includes('stable') || mods.includes('both-edges')) {
    style['scrollbar-gutter'] = mods.includes('both-edges')
      ? 'stable both-edges'
      : 'stable';
  }

  // Custom size (all values are sizes)
  const sizeValue = values[0];
  if (sizeValue) {
    style['&::-webkit-scrollbar'] = {
      ...(style['&::-webkit-scrollbar'] || {}),
      width: sizeValue,
      height: sizeValue,
    };
  }

  // Colors (support up to 3: thumb, track, corner)
  if (colors && colors.length) {
    const thumb = colors[0] || 'var(--scrollbar-thumb-color)';
    const track = colors[1] || 'var(--scrollbar-track-color)';
    const corner = colors[2] || track;
    style['scrollbar-color'] = `${thumb} ${track}`;
    if (!style['&::-webkit-scrollbar-corner']) {
      style['&::-webkit-scrollbar-corner'] = {};
    }
    style['&::-webkit-scrollbar-corner'].background = corner;
  }

  // always: force scrollbars to show (requires overflow)
  if (mods.includes('always')) {
    style['overflow'] = overflow || 'scroll';
    style['scrollbar-gutter'] = style['scrollbar-gutter'] || 'always';
  }

  // Legacy styled mod
  if (mods.includes('styled')) {
    const baseTransition = [
      'background var(--transition)',
      'border-radius var(--transition)',
      'box-shadow var(--transition)',
      'width var(--transition)',
      'height var(--transition)',
      'border var(--transition)',
    ].join(', ');
    style['scrollbar-width'] = style['scrollbar-width'] || 'thin';
    style['scrollbar-color'] =
      style['scrollbar-color'] ||
      'var(--scrollbar-thumb-color) var(--scrollbar-track-color)';
    style['&::-webkit-scrollbar'] = {
      ...(style['&::-webkit-scrollbar'] || {}),
      width: sizeValue || '8px',
      height: sizeValue || '8px',
      background: 'var(--scrollbar-track-color)',
      transition: baseTransition,
    };
    style['&::-webkit-scrollbar-thumb'] = {
      background: 'var(--scrollbar-thumb-color)',
      borderRadius: '8px',
      minHeight: '24px',
      transition: baseTransition,
    };
    style['&::-webkit-scrollbar-corner'] = {
      ...(style['&::-webkit-scrollbar-corner'] || {}),
      background: 'var(--scrollbar-track-color)',
      transition: baseTransition,
    };
  }

  return style;
}

scrollbarStyle.__lookupStyles = ['scrollbar', 'overflow'];

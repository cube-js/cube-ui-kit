import { parseStyle } from '../utils/styles';

interface ScrollbarStyleProps {
  scrollbar?: string | boolean | number;
  overflow?: string;
}

/**
 * Creates cross-browser compatible scrollbar styles
 *
 * Supports both Firefox (scrollbar-width, scrollbar-color) and
 * WebKit/Chromium browsers (::-webkit-scrollbar)
 */
export function scrollbarStyle({ scrollbar, overflow }: ScrollbarStyleProps) {
  // Check if scrollbar is defined
  if (!scrollbar && scrollbar !== 0) return;

  // Support true as alias for thin
  const value = scrollbar === true || scrollbar === '' ? 'thin' : scrollbar;
  const { mods, colors, values } = parseStyle(String(value));
  const style = {};

  // Default colors for scrollbar
  const defaultThumbColor = 'var(--scrollbar-thumb-color)';
  const defaultTrackColor = 'var(--scrollbar-track-color)';

  // Setup default Firefox scrollbar style
  style['scrollbar-color'] = `${defaultThumbColor} transparent`;

  // Default scrollbar size
  const defaultSize = '8px';
  const sizeValue = values[0] || defaultSize;

  // Process modifiers
  if (mods.includes('thin')) {
    style['scrollbar-width'] = 'thin';
  } else if (values.includes('none')) {
    style['scrollbar-width'] = 'none';
    style['scrollbar-color'] = 'transparent transparent';
    // Also hide WebKit scrollbars
    style['&::-webkit-scrollbar'] = {
      width: '0px',
      height: '0px',
      display: 'none',
    };

    return style;
  } else if (mods.includes('auto')) {
    style['scrollbar-width'] = 'auto';
  }

  // Handle scrollbar gutter behavior
  if (mods.includes('stable') || mods.includes('both-edges')) {
    // scrollbar-gutter is supported in newer browsers only
    style['scrollbar-gutter'] = mods.includes('both-edges')
      ? 'stable both-edges'
      : 'stable';
  }

  // Custom size setup for WebKit
  if (sizeValue) {
    style['&::-webkit-scrollbar'] = {
      ...(style['&::-webkit-scrollbar'] || {}),
      width: sizeValue,
      height: sizeValue,
    };
  }

  // Extract colors (support up to 3: thumb, track, corner)
  // These will be used in various places throughout the function
  const thumbColor = colors && colors[0] ? colors[0] : defaultThumbColor;
  const trackColor = colors && colors[1] ? colors[1] : defaultTrackColor;
  const cornerColor = colors && colors[2] ? colors[2] : trackColor;

  // Apply colors if they are specified
  if (colors && colors.length) {
    // Firefox
    style['scrollbar-color'] = `${thumbColor} ${trackColor}`;

    // WebKit - always set these for consistency
    if (!style['&::-webkit-scrollbar']) {
      style['&::-webkit-scrollbar'] = {};
    }
    style['&::-webkit-scrollbar']['background'] = trackColor;

    style['&::-webkit-scrollbar-track'] = {
      ...(style['&::-webkit-scrollbar-track'] || {}),
      background: trackColor,
    };

    style['&::-webkit-scrollbar-thumb'] = {
      ...(style['&::-webkit-scrollbar-thumb'] || {}),
      background: thumbColor,
    };

    style['&::-webkit-scrollbar-corner'] = {
      ...(style['&::-webkit-scrollbar-corner'] || {}),
      background: cornerColor,
    };
  }

  // Handle 'always' mode: force scrollbars to show
  if (mods.includes('always')) {
    style['overflow'] = overflow || 'scroll';

    // Use auto for WebKit browsers since they don't support 'always'
    // This is closer to the expected behavior
    if (!style['scrollbar-gutter']) {
      style['scrollbar-gutter'] = 'stable';
    }

    // Ensure scrollbars appear in WebKit even with little content
    if (!style['&::-webkit-scrollbar']) {
      style['&::-webkit-scrollbar'] = {};
    }
    style['&::-webkit-scrollbar']['display'] = 'block';
  }

  // Enhanced 'styled' mode with better transitions and appearance
  if (mods.includes('styled')) {
    const baseTransition = [
      'background var(--transition)',
      'border-radius var(--transition)',
      'box-shadow var(--transition)',
      'width var(--transition)',
      'height var(--transition)',
      'border var(--transition)',
    ].join(', ');

    // Firefox
    style['scrollbar-width'] = style['scrollbar-width'] || 'thin';
    style['scrollbar-color'] =
      style['scrollbar-color'] || `${defaultThumbColor} ${defaultTrackColor}`;

    // WebKit
    style['&::-webkit-scrollbar'] = {
      width: sizeValue,
      height: sizeValue,
      transition: baseTransition,
      background: defaultTrackColor,
      ...(style['&::-webkit-scrollbar'] || {}),
    };

    style['&::-webkit-scrollbar-thumb'] = {
      'border-radius': '8px',
      'min-height': '24px',
      transition: baseTransition,
      background: defaultThumbColor,
      ...(style['&::-webkit-scrollbar-thumb'] || {}),
    };

    style['&::-webkit-scrollbar-track'] = {
      background: defaultTrackColor,
      transition: baseTransition,
      ...(style['&::-webkit-scrollbar-track'] || {}),
    };

    style['&::-webkit-scrollbar-corner'] = {
      background: defaultTrackColor,
      transition: baseTransition,
      ...(style['&::-webkit-scrollbar-corner'] || {}),
    };
  }

  return style;
}

scrollbarStyle.__lookupStyles = ['scrollbar', 'overflow'];

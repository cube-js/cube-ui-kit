import { parseStyle } from '../utils/styles';

import { Styles } from './types';

/**
 * Convert a value to CSS, handling numbers as pixels for numeric properties
 */
function toCSS(
  value: string | number | undefined,
  isNumeric: boolean,
): string | null {
  if (value == null) return null;
  if (typeof value === 'number') {
    return isNumeric ? `${value}px` : String(value);
  }
  // Parse through style parser to handle custom units like 1x, 2r, etc.
  const processed = parseStyle(String(value));
  return processed.groups[0]?.values[0] || String(value);
}

function setCSSValue(
  styles: Styles,
  styleName: string,
  presetName: string,
  isPropOnly = false,
) {
  styles[`--${styleName}`] = (() => {
    if (presetName === 'inherit') {
      return 'inherit';
    }

    const defaultValue = `var(--default-${styleName}, ${
      styleName === 'font-family'
        ? 'var(--font, NonexistentFontName)'
        : 'inherit'
    })`;
    const fontSuffix =
      styleName === 'font-family' ? ', var(--font, sans-serif)' : '';

    if (presetName === 'default') {
      return `${defaultValue}${fontSuffix}`;
    } else {
      return `var(--${presetName}-${styleName}, ${defaultValue})${fontSuffix}`;
    }
  })();

  if (!isPropOnly) {
    styles[styleName] = styles[`--${styleName}`];
  }
}

interface PresetStyleProps {
  preset?: string | boolean;
  fontSize?: string | number;
  lineHeight?: string | number;
  textTransform?: string;
  letterSpacing?: string | number;
  fontWeight?: string | number;
  fontStyle?: string | boolean;
  fontFamily?: string;
  /** Alias for fontFamily with special handling for 'monospace' and boolean */
  font?: string | boolean;
}

/**
 * Resolve font/fontFamily value to CSS font-family string.
 *
 * - `font="monospace"` → var(--monospace-font)
 * - `font={true}` → var(--font)
 * - `font="CustomFont"` → CustomFont, var(--font)
 * - `fontFamily="Arial"` → Arial (direct, no fallback)
 */
function resolveFontFamily(
  font: string | boolean | undefined,
  fontFamily: string | undefined,
): { value: string; setVar: boolean } | null {
  // fontFamily takes precedence as a direct value
  if (fontFamily) {
    return { value: fontFamily, setVar: false };
  }

  if (font == null || font === false) {
    return null;
  }

  if (font === 'monospace') {
    return { value: 'var(--monospace-font)', setVar: true };
  }

  if (font === true) {
    return { value: 'var(--font)', setVar: true };
  }

  return { value: `${font}, var(--font)`, setVar: true };
}

/**
 * Handles typography preset and individual font properties.
 *
 * When `preset` is defined, it sets up CSS custom properties for typography.
 * Individual font props can be used with or without `preset`:
 * - With `preset`: overrides the preset value for that property
 * - Without `preset`: outputs the CSS directly
 *
 * Number values are converted to pixels for fontSize, lineHeight, letterSpacing.
 * fontWeight accepts numbers directly (e.g., 400, 700).
 *
 * font vs fontFamily:
 * - `font` is the recommended prop with special handling (monospace, boolean, fallback)
 * - `fontFamily` is a direct value without special handling
 */
export function presetStyle({
  preset,
  fontSize,
  lineHeight,
  textTransform,
  letterSpacing,
  fontWeight,
  fontStyle,
  fontFamily,
  font,
}: PresetStyleProps) {
  const styles: Styles = {};
  const hasPreset = preset != null && preset !== false;

  // Handle preset if defined
  if (hasPreset) {
    let presetValue = preset === true ? '' : String(preset);

    const processed = parseStyle(presetValue);
    let { mods } = processed.groups[0] ?? ({ mods: [] } as any);

    const isStrong = mods.includes('strong');
    const isItalic = mods.includes('italic');
    const isIcon = mods.includes('icon');
    const isTight = mods.includes('tight');

    mods = mods.filter(
      (mod) =>
        mod !== 'bold' && mod !== 'italic' && mod !== 'icon' && mod !== 'tight',
    );

    const name = mods[0] || 'default';

    // Set preset values for properties not explicitly overridden
    if (fontSize == null) {
      setCSSValue(styles, 'font-size', name);
    }
    if (lineHeight == null) {
      setCSSValue(styles, 'line-height', name);
    }
    if (letterSpacing == null) {
      setCSSValue(styles, 'letter-spacing', name);
    }
    if (fontWeight == null) {
      setCSSValue(styles, 'font-weight', name);
    }
    if (fontStyle == null) {
      setCSSValue(styles, 'font-style', name);
    }
    if (textTransform == null) {
      setCSSValue(styles, 'text-transform', name);
    }
    if (fontFamily == null && font == null) {
      setCSSValue(styles, 'font-family', name);
    }

    setCSSValue(styles, 'bold-font-weight', name, true);
    setCSSValue(styles, 'icon-size', name, true);

    if (isStrong) {
      styles['font-weight'] = 'var(--bold-font-weight)';
    }
    if (isItalic) {
      styles['font-style'] = 'italic';
    }
    if (isIcon) {
      styles['font-size'] = 'var(--icon-size)';
      styles['line-height'] = 'var(--icon-size)';
    }
    if (isTight) {
      styles['line-height'] = 'var(--font-size)';
    }
  }

  // Handle individual font properties (work with or without preset)
  const fontSizeVal = toCSS(fontSize, true);
  if (fontSizeVal) {
    styles['font-size'] = fontSizeVal;
  }

  const lineHeightVal = toCSS(lineHeight, true);
  if (lineHeightVal) {
    styles['line-height'] = lineHeightVal;
  }

  const letterSpacingVal = toCSS(letterSpacing, true);
  if (letterSpacingVal) {
    styles['letter-spacing'] = letterSpacingVal;
  }

  // fontWeight: numbers should NOT get 'px' suffix
  const fontWeightVal = toCSS(fontWeight, false);
  if (fontWeightVal) {
    styles['font-weight'] = fontWeightVal;
  }

  // fontStyle: handle boolean (true → italic) and string values
  if (fontStyle != null) {
    if (fontStyle === true) {
      styles['font-style'] = 'italic';
    } else if (fontStyle !== 'inherit') {
      styles['font-style'] = fontStyle ? 'italic' : 'normal';
    } else {
      styles['font-style'] = 'inherit';
    }
  }

  if (textTransform) {
    styles['text-transform'] = textTransform;
  }

  // Handle font/fontFamily (font has special handling, fontFamily is direct)
  const fontResult = resolveFontFamily(font, fontFamily);
  if (fontResult) {
    styles['font-family'] = fontResult.value;
    if (fontResult.setVar) {
      styles['--font-family'] = fontResult.value;
    }
  }

  // Return undefined if no styles to apply
  if (Object.keys(styles).length === 0) {
    return;
  }

  return styles;
}

presetStyle.__lookupStyles = [
  'preset',
  'fontSize',
  'lineHeight',
  'letterSpacing',
  'textTransform',
  'fontWeight',
  'fontStyle',
  'fontFamily',
  'font',
];

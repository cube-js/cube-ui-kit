/**
 * Typography preset configuration.
 * Each preset defines font properties that get expanded into CSS custom properties.
 */
export interface TypographyPreset {
  fontSize: string;
  lineHeight: string;
  letterSpacing?: string;
  fontWeight: string | number;
  boldFontWeight?: string | number;
  iconSize?: string;
  textTransform?: string;
  fontFamily?: string;
  fontStyle?: string;
}

/**
 * Typography presets for headings, text, and special styles.
 *
 * Naming conventions:
 * - `h1`-`h6`: Headings (bold by default)
 * - `t1`-`t4`: Text styles (regular weight)
 * - `t1m`-`t4m`: Text styles medium weight
 * - `m1`-`m3`: Markdown/prose styles (larger line-height)
 * - `p1`-`p4`: Paragraph styles
 * - `c1`-`c2`: Caption/uppercase styles
 * - `tag`: Tag/badge typography
 * - `strong`, `em`: Inline semantic styles
 * - `default`: Base text style
 */
export const TYPOGRAPHY_PRESETS: Record<string, TypographyPreset> = {
  // Text (basic)
  text: {
    fontSize: '14px',
    lineHeight: '20px',
    letterSpacing: '0',
    fontWeight: '400',
  },

  // Headings (h1-h6)
  h1: {
    fontSize: '36px',
    lineHeight: '44px',
    letterSpacing: '-0.01em',
    fontWeight: '600',
    boldFontWeight: '700',
    iconSize: '40px',
  },
  h2: {
    fontSize: '24px',
    lineHeight: '32px',
    letterSpacing: '0em',
    fontWeight: '600',
    boldFontWeight: '700',
    iconSize: '28px',
  },
  h3: {
    fontSize: '20px',
    lineHeight: '28px',
    letterSpacing: '0em',
    fontWeight: '600',
    boldFontWeight: '700',
    iconSize: '24px',
  },
  h4: {
    fontSize: '18px',
    lineHeight: '24px',
    letterSpacing: '0',
    fontWeight: '600',
    boldFontWeight: '700',
    iconSize: '22px',
  },
  h5: {
    fontSize: '16px',
    lineHeight: '22px',
    letterSpacing: '0',
    fontWeight: '600',
    boldFontWeight: '700',
    iconSize: '20px',
  },
  h6: {
    fontSize: '14px',
    lineHeight: '20px',
    letterSpacing: '0.01em',
    fontWeight: '600',
    boldFontWeight: '700',
    iconSize: '20px',
  },

  // Text styles (t1-t4)
  t1: {
    fontSize: '18px',
    lineHeight: '24px',
    letterSpacing: '0',
    fontWeight: '400',
    iconSize: '20px',
  },
  t2: {
    fontSize: '16px',
    lineHeight: '22px',
    letterSpacing: '0',
    fontWeight: '400',
    iconSize: '20px',
  },
  t2m: {
    fontSize: '16px',
    lineHeight: '22px',
    letterSpacing: '0',
    fontWeight: '500',
    iconSize: '20px',
  },
  t3: {
    fontSize: '14px',
    lineHeight: '20px',
    letterSpacing: '0',
    fontWeight: '400',
    iconSize: '18px',
  },
  t3m: {
    fontSize: '14px',
    lineHeight: '20px',
    letterSpacing: '0',
    fontWeight: '500',
    iconSize: '18px',
  },
  t4: {
    fontSize: '12px',
    lineHeight: '18px',
    letterSpacing: '0',
    fontWeight: '500',
    iconSize: '16px',
  },
  t4m: {
    fontSize: '12px',
    lineHeight: '18px',
    letterSpacing: '0',
    fontWeight: '600',
    boldFontWeight: '700',
    iconSize: '16px',
  },

  // Markdown/prose styles (m1-m3)
  m1: {
    fontSize: '18px',
    lineHeight: '32px',
    letterSpacing: '0',
    fontWeight: '400',
    iconSize: '22px',
  },
  m2: {
    fontSize: '16px',
    lineHeight: '28px',
    letterSpacing: '0',
    fontWeight: '400',
    iconSize: '20px',
  },
  m3: {
    fontSize: '14px',
    lineHeight: '24px',
    letterSpacing: '0',
    fontWeight: '400',
    iconSize: '20px',
  },

  // Paragraph styles (p1-p4)
  p1: {
    fontSize: '18px',
    lineHeight: '28px',
    letterSpacing: '0',
    fontWeight: '400',
    iconSize: '22px',
  },
  p2: {
    fontSize: '16px',
    lineHeight: '24px',
    letterSpacing: '0',
    fontWeight: '400',
    iconSize: '20px',
  },
  p3: {
    fontSize: '14px',
    lineHeight: '22px',
    letterSpacing: '0',
    fontWeight: '400',
    iconSize: '18px',
  },
  p4: {
    fontSize: '12px',
    lineHeight: '20px',
    letterSpacing: '0',
    fontWeight: '500',
    iconSize: '16px',
  },

  // Caption/uppercase styles (c1-c2)
  c1: {
    fontSize: '14px',
    lineHeight: '20px',
    letterSpacing: '0',
    fontWeight: '600',
    boldFontWeight: '700',
    textTransform: 'uppercase',
    iconSize: '18px',
  },
  c2: {
    fontSize: '12px',
    lineHeight: '18px',
    letterSpacing: '0.01em',
    fontWeight: '600',
    boldFontWeight: '700',
    textTransform: 'uppercase',
    iconSize: '16px',
  },

  // Tag typography
  tag: {
    fontSize: '12px',
    lineHeight: '18px',
    letterSpacing: '0.01em',
    fontWeight: '600',
    boldFontWeight: '700',
    iconSize: '16px',
  },

  // Inline semantic styles
  strong: {
    fontSize: 'inherit',
    lineHeight: 'inherit',
    letterSpacing: 'inherit',
    fontFamily: 'inherit',
    fontStyle: 'inherit',
    fontWeight: 'var(--bold-font-weight, var(--default-bold-font-weight, 600))',
  },
  em: {
    fontSize: 'inherit',
    lineHeight: 'inherit',
    letterSpacing: 'inherit',
    fontFamily: 'inherit',
    fontStyle: 'italic',
    fontWeight: 'inherit',
  },

  // Default text style (references t3)
  default: {
    fontSize: 'var(--t3-font-size)',
    lineHeight: 'var(--t3-line-height)',
    letterSpacing: 'var(--t3-letter-spacing)',
    fontWeight: 'var(--t3-font-weight)',
    boldFontWeight: '600',
    iconSize: 'inherit',
  },
};

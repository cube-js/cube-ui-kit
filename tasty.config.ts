/**
 * Tasty Extension Configuration
 *
 * This file configures the tasty VSCode extension for the @cube-dev/ui-kit project.
 * It provides token names, units, presets, and state aliases for validation and autocomplete.
 *
 * Projects using @cube-dev/ui-kit can extend this config:
 * ```typescript
 * export default {
 *   extends: '@cube-dev/ui-kit',
 *   // Add project-specific tokens, presets, etc.
 * };
 * ```
 *
 * @see https://github.com/tenphi/tasty-vscode-extension for extension documentation
 */

export default {
  /**
   * Valid token names for validation and autocomplete.
   * Color tokens use # prefix, custom properties use $ prefix.
   */
  tokens: [
    // ============================================================================
    // Color Tokens (from src/tokens/colors.ts)
    // ============================================================================

    // Pink
    '#pink',

    // Purple (primary)
    '#purple',
    '#purple-text',
    '#purple-bg',
    '#purple-icon',
    '#purple-disabled',
    '#purple-01',
    '#purple-02',
    '#purple-03',
    '#purple-04',

    // Focus
    '#focus',

    // Text
    '#text',

    // Dark shades
    '#dark',
    '#dark-01',
    '#dark-02',
    '#dark-03',
    '#dark-04',
    '#dark-05',
    '#dark-bg',

    // Light
    '#light',

    // Black & White
    '#white',
    '#black',

    // Danger (red)
    '#danger',
    '#danger-text',
    '#danger-bg',
    '#danger-icon',
    '#danger-disabled',

    // Success (green)
    '#success',
    '#success-text',
    '#success-bg',
    '#success-icon',
    '#success-disabled',

    // Warning (yellow/amber)
    '#warning',
    '#warning-text',
    '#warning-bg',
    '#warning-icon',
    '#warning-disabled',

    // Note (violet)
    '#note',
    '#note-text',
    '#note-bg',
    '#note-icon',
    '#note-disabled',

    // Border
    '#border',

    // Placeholder
    '#placeholder',

    // Semantic colors
    '#clear',
    '#shadow',
    '#minor',
    '#primary',

    // Disabled state colors
    '#disabled',
    '#disabled-text',
    '#disabled-bg',

    // Scrollbar colors (from base.ts)
    '#scrollbar-thumb',
    '#scrollbar-outline',
    '#scrollbar-bg',
    '#scrollbar-corner',

    // Tabs tokens
    '#tabs-fade-left',
    '#tabs-fade-right',
    '$tab-indicator-size',

    // ============================================================================
    // Custom Property Tokens (from src/tokens/base.ts)
    // ============================================================================

    // Typography base
    '$font-size',
    '$line-height',

    // Input typography
    '$input-font-size',
    '$input-line-height',
    '$input-letter-spacing',

    // Opacity & dimensions
    '$disabled-opacity',
    '$gap',
    '$stroke-width',
    '$outline-width',
    '$border-width',

    // Border radius
    '$radius',
    '$large-radius',
    '$card-radius',
    '$leaf-sharp-radius',

    // Misc dimensions
    '$fade-width',
    '$min-dialog-size',

    // Transitions
    '$transition',
    '$disclosure-transition',
    '$tab-transition',
    '$fade-transition',

    // Scrollbar tokens
    '$scrollbar-width',
    '$scrollbar-outline-width',
    '$scrollbar-radius',

    // ============================================================================
    // Spacing Tokens (from src/tokens/spacing.ts)
    // ============================================================================
    '$space-xs',
    '$space-sm',
    '$space-md',
    '$space-lg',
    '$space-xl',

    // ============================================================================
    // Size Tokens (from src/tokens/sizes.ts)
    // ============================================================================
    '$size-xs',
    '$size-sm',
    '$size-md',
    '$size-lg',
    '$size-xl',

    // ============================================================================
    // Shadow Tokens (from src/tokens/shadows.ts)
    // ============================================================================
    '$item-shadow',
    '$card-shadow',
    '$dialog-shadow',

    // ============================================================================
    // Layout Tokens (from src/tokens/layout.ts)
    // ============================================================================
    '$max-content-width',
    '$topbar-height',
    '$devmodebar-height',
    '$sidebar-width',
    '$border-radius-base',

    // Scrollbar tokens
    '$scrollbar-h-left',
    '$scrollbar-h-width',
  ],

  // Note: Built-in units (x, r, cr, bw, ow, fs, lh, sf) are always available.
  // No need to list them here - they're automatically included by the extension.

  /**
   * State alias names for autocomplete.
   * These are predefined responsive and theme states.
   */
  states: ['@mobile', '@compact'],

  /**
   * Valid preset names for the `preset` style property.
   * These are defined in src/tokens/typography.ts.
   *
   * Note: Preset modifiers (strong, italic, icon, tight) are built-in
   * and can be combined with any preset (e.g., 't1 strong', 'h2 italic').
   */
  presets: [
    // Base text
    'default',

    // Headings (h1-h6)
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',

    // Text styles (t1-t4, with medium weight variants)
    't1',
    't2',
    't2m',
    't3',
    't3m',
    't4',
    't4m',

    // Markdown/prose styles (m1-m3)
    'm1',
    'm2',
    'm3',

    // Paragraph styles (p1-p4)
    'p1',
    'p2',
    'p3',
    'p4',

    // Caption/uppercase styles (c1-c2)
    'c1',
    'c2',

    // Tag typography
    'tag',

    // Inline semantic styles
    'strong',
    'em',
  ],

  /**
   * Descriptions for presets, shown on hover.
   * Based on typography.ts definitions.
   */
  presetDescriptions: {
    // Headings
    h1: 'Heading 1 (36px/44px, semibold)',
    h2: 'Heading 2 (24px/32px, semibold)',
    h3: 'Heading 3 (20px/28px, semibold)',
    h4: 'Heading 4 (18px/24px, semibold)',
    h5: 'Heading 5 (16px/22px, semibold)',
    h6: 'Heading 6 (14px/20px, semibold)',

    // Text styles
    t1: 'Text large (18px/24px)',
    t2: 'Text regular (16px/22px)',
    t2m: 'Text regular medium (16px/22px, medium weight)',
    t3: 'Text default (14px/20px)',
    t3m: 'Text default medium (14px/20px, medium weight)',
    t4: 'Text small (12px/18px, medium weight)',
    t4m: 'Text small semibold (12px/18px, semibold)',

    // Markdown/prose styles
    m1: 'Markdown large (18px/32px, relaxed line-height)',
    m2: 'Markdown regular (16px/28px, relaxed line-height)',
    m3: 'Markdown default (14px/24px, relaxed line-height)',

    // Paragraph styles
    p1: 'Paragraph large (18px/28px)',
    p2: 'Paragraph regular (16px/24px)',
    p3: 'Paragraph default (14px/22px)',
    p4: 'Paragraph small (12px/20px, medium weight)',

    // Caption/uppercase
    c1: 'Caption (14px/20px, semibold, uppercase)',
    c2: 'Caption small (12px/18px, semibold, uppercase)',

    // Other
    tag: 'Tag/badge typography (12px/18px, semibold)',
    default: 'Base text style (inherits t3)',
    strong: 'Bold/semibold text (inherits font size)',
    em: 'Italic text (inherits font size)',
  },

  /**
   * Descriptions for state aliases, shown on hover.
   */
  stateDescriptions: {
    '@mobile': 'Mobile viewport (width < 768px)',
    '@compact': 'Compact layout (width < 600px)',
  },
};

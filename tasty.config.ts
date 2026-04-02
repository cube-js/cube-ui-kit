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
  extends: '@tenphi/tasty',

  tokens: [
    // Color Tokens (from src/tokens/colors.ts)
    '#pink',
    '#purple',
    '#purple-text',
    '#purple-bg',
    '#purple-icon',
    '#purple-disabled',
    '#purple-01',
    '#purple-02',
    '#purple-03',
    '#purple-04',
    '#focus',
    '#text',
    '#dark',
    '#dark-01',
    '#dark-02',
    '#dark-03',
    '#dark-04',
    '#dark-05',
    '#surface',
    '#surface-2',
    '#surface-3',
    '#light',
    '#danger',
    '#danger-text',
    '#danger-bg',
    '#danger-icon',
    '#danger-disabled',
    '#success',
    '#success-text',
    '#success-bg',
    '#success-icon',
    '#success-disabled',
    '#warning',
    '#warning-text',
    '#warning-bg',
    '#warning-icon',
    '#warning-disabled',
    '#note',
    '#note-text',
    '#note-bg',
    '#note-icon',
    '#note-disabled',
    '#border',
    '#placeholder',
    '#clear',
    '#shadow',
    '#minor',
    '#primary',
    '#primary-text',
    '#disabled',
    '#disabled-text',
    '#disabled-bg',
    '#disabled-opacity',
    '#scrollbar-thumb',
    '#scrollbar-outline',
    '#scrollbar-bg',
    '#scrollbar-corner',
    '#tabs-fade-left',
    '#tabs-fade-right',
    '#slider-thumb',
    '#slider-thumb-hovered',

    // Custom Property Tokens (from src/tokens/base.ts)
    '$tab-indicator-size',
    '$font-size',
    '$line-height',
    '$input-font-size',
    '$input-line-height',
    '$input-letter-spacing',
    '$disabled-opacity',
    '$stroke-width',
    '$large-radius',
    '$card-radius',
    '$leaf-sharp-radius',
    '$fade-width',
    '$min-dialog-size',
    '$disclosure-transition',
    '$tab-transition',
    '$fade-transition',
    '$scrollbar-width',
    '$scrollbar-outline-width',
    '$scrollbar-radius',

    // Spacing Tokens
    '$space-xs',
    '$space-sm',
    '$space-md',
    '$space-lg',
    '$space-xl',

    // Size Tokens
    '$size-xs',
    '$size-sm',
    '$size-md',
    '$size-lg',
    '$size-xl',

    // Shadow Tokens
    '$item-shadow',
    '$card-shadow',
    '$dialog-shadow',

    // Layout Tokens
    '$max-content-width',
    '$topbar-height',
    '$devmodebar-height',
    '$sidebar-width',
    '$border-radius-base',
    '$scrollbar-h-left',
    '$scrollbar-h-width',
  ],

  // Note: Built-in units (x, r, cr, bw, ow, fs, lh, sf) are always available.
  // No need to list them here - they're automatically included by the extension.

  /**
   * Valid recipe names for the `recipe` style property.
   * These are defined in src/components/Root.tsx via configure().
   */
  recipes: [
    'reset',
    'button',
    'input',
    'input-autofill',
    'input-placeholder',
    'input-search-cancel-button',
  ],

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
   * and can be combined with any preset using `/` separator (e.g., 't1 / strong', 'h2 / italic').
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
    'inline',
  ],
};

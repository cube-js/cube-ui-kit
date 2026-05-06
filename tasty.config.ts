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
    // ---- Glaze: neutral surface ramp (default theme) ----
    '#surface',
    '#surface-2',
    '#surface-3',
    '#surface-inverse',
    '#surface-text',
    '#surface-text-soft',
    '#surface-text-soft-2',
    '#surface-2-text',
    '#surface-2-text-soft',
    '#surface-3-text',
    '#surface-3-text-soft',

    // ---- Glaze: accent system (default theme) ----
    '#accent-surface',
    '#accent-surface-2',
    '#accent-surface-3',
    '#accent-surface-hover',
    '#accent-surface-text',
    '#accent-text',
    '#accent-text-soft',
    '#accent-icon',

    // ---- Glaze: per-theme primary / purple (purple is alias of primary) ----
    '#primary',
    '#primary-bg',
    '#primary-text',
    '#primary-text-soft',
    '#primary-icon',
    '#primary-hover',
    '#primary-disabled',
    '#primary-desaturated',
    '#primary-surface',
    '#primary-surface-text',
    '#primary-accent-surface',
    '#primary-accent-surface-2',
    '#primary-accent-surface-3',
    '#primary-accent-surface-hover',
    '#primary-accent-surface-text',
    '#primary-accent-text',
    '#primary-accent-text-soft',
    '#primary-accent-icon',
    '#purple',
    '#purple-bg',
    '#purple-text',
    '#purple-text-soft',
    '#purple-icon',
    '#purple-hover',
    '#purple-disabled',
    '#purple-surface',
    '#purple-surface-text',
    '#purple-accent-surface',
    '#purple-accent-surface-2',
    '#purple-accent-surface-3',
    '#purple-accent-surface-hover',
    '#purple-accent-surface-text',
    '#purple-accent-text',
    '#purple-accent-text-soft',
    '#purple-accent-icon',

    // ---- Glaze: per-theme danger ----
    '#danger',
    '#danger-bg',
    '#danger-text',
    '#danger-text-soft',
    '#danger-icon',
    '#danger-hover',
    '#danger-disabled',
    '#danger-desaturated',
    '#danger-surface',
    '#danger-surface-text',
    '#danger-accent-surface',
    '#danger-accent-surface-2',
    '#danger-accent-surface-3',
    '#danger-accent-surface-hover',
    '#danger-accent-surface-text',
    '#danger-accent-text',
    '#danger-accent-text-soft',
    '#danger-accent-icon',

    // ---- Glaze: per-theme success ----
    '#success',
    '#success-bg',
    '#success-text',
    '#success-text-soft',
    '#success-icon',
    '#success-hover',
    '#success-disabled',
    '#success-desaturated',
    '#success-surface',
    '#success-surface-text',
    '#success-accent-surface',
    '#success-accent-surface-2',
    '#success-accent-surface-3',
    '#success-accent-surface-hover',
    '#success-accent-surface-text',
    '#success-accent-text',
    '#success-accent-text-soft',
    '#success-accent-icon',

    // ---- Glaze: per-theme warning ----
    '#warning',
    '#warning-bg',
    '#warning-text',
    '#warning-text-soft',
    '#warning-icon',
    '#warning-hover',
    '#warning-disabled',
    '#warning-desaturated',
    '#warning-surface',
    '#warning-surface-text',
    '#warning-accent-surface',
    '#warning-accent-surface-2',
    '#warning-accent-surface-3',
    '#warning-accent-surface-hover',
    '#warning-accent-surface-text',
    '#warning-accent-text',
    '#warning-accent-text-soft',
    '#warning-accent-icon',

    // ---- Glaze: per-theme note ----
    '#note',
    '#note-bg',
    '#note-text',
    '#note-text-soft',
    '#note-icon',
    '#note-hover',
    '#note-disabled',
    '#note-desaturated',
    '#note-surface',
    '#note-surface-text',
    '#note-accent-surface',
    '#note-accent-surface-2',
    '#note-accent-surface-3',
    '#note-accent-surface-hover',
    '#note-accent-surface-text',
    '#note-accent-text',
    '#note-accent-text-soft',
    '#note-accent-icon',

    // ---- Glaze: PrismCode syntax palette ----
    '#code-comment',
    '#code-punctuation',
    '#code-keyword',
    '#code-string',
    '#code-number',
    '#code-function',
    '#code-attribute',

    // ---- Glaze: shadows / overlays / focus / placeholder ----
    '#shadow-sm',
    '#shadow-md',
    '#shadow-lg',
    '#overlay',
    '#focus',
    '#placeholder',

    // ---- Legacy aliases (mapped in src/tokens/colors.ts) ----
    '#pink',
    '#text',
    '#dark',
    '#dark-bg',
    '#dark-01',
    '#dark-02',
    '#dark-03',
    '#dark-04',
    '#dark-05',
    '#purple-01',
    '#purple-02',
    '#purple-03',
    '#purple-04',
    '#light',
    '#border',
    '#clear',
    '#shadow',
    '#minor',
    '#disabled',
    '#disabled-text',
    '#disabled-bg',
    '#disabled-opacity',

    // ---- Component-local custom tokens ----
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

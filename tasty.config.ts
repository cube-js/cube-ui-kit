/**
 * Tasty Extension Configuration
 *
 * This file configures the tasty VSCode extension for the @cube-dev/ui-kit project.
 * It provides token names, units, presets, and state aliases for validation and autocomplete.
 *
 * @see https://github.com/tenphi/tasty-vscode-extension for extension documentation
 */

import type { TastyExtensionConfig } from './src/tasty';

const config: TastyExtensionConfig = {
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

  /**
   * Valid custom unit names.
   * Built-in units are always available: x, r, cr, bw, ow, fs, lh, sf
   */
  units: [
    'x', // Gap multiplier (e.g., 2x = 2 * $gap)
    'r', // Border radius (e.g., 1r = $radius)
    'cr', // Card radius (e.g., 1cr = $card-radius)
    'bw', // Border width (e.g., 1bw = $border-width)
    'ow', // Outline width (e.g., 1ow = $outline-width)
    'fs', // Font size
    'lh', // Line height
    'sf', // Stable fraction
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
};

export default config;

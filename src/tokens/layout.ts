import type { Styles } from '../tasty/styles/types';

/**
 * Layout-related tokens for common UI dimensions.
 *
 * Keys use $ prefix for CSS custom properties.
 */
export const LAYOUT_TOKENS: Styles = {
  /** Maximum width for main content areas */
  '$max-content-width': '1440px',
  /** Height of the top navigation bar */
  '$topbar-height': '48px',
  /** Height of the development mode indicator bar */
  '$devmodebar-height': '54px',
  /** Width of the sidebar navigation */
  '$sidebar-width': '200px',
  /** Base border radius (legacy, prefer `radius`) */
  '$border-radius-base': '4px',
};

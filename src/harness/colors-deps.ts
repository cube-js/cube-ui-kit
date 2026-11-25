/**
 * What `uikit:colors` loads: Glaze, its measuring module and UI Kit's palette.
 * The build bundles it into `dist/harness/colors-deps.js` with everything it
 * imports, so the tool also runs from a package that harnesspm fetched without
 * an install.
 */
export * as glaze from '@tenphi/glaze';
export * as measure from '@tenphi/glaze/harness/measure';
export { getCodeTheme, getPalette, getPaletteTokens } from '../tokens/palette';
export { getColorTokens } from '../tokens/colors';

/**
 * Style chunk definitions for CSS chunking optimization.
 *
 * Styles are grouped into chunks based on:
 * 1. Handler dependencies - styles that share a handler MUST be in the same chunk
 * 2. Logical grouping - related styles grouped for better cache reuse
 *
 * See STYLE_CHUNKING_SPEC.md for detailed rationale.
 *
 * ============================================================================
 * ⚠️  CRITICAL ARCHITECTURAL CONSTRAINT: NO CROSS-CHUNK HANDLER DEPENDENCIES
 * ============================================================================
 *
 * Style handlers declare their dependencies via `__lookupStyles` array.
 * This creates a dependency graph where handlers read multiple style props.
 *
 * **ALL styles in a handler's `__lookupStyles` MUST be in the SAME chunk.**
 *
 * Why this matters:
 * 1. Each chunk computes a cache key from ONLY its own style values
 * 2. If a handler reads a style from another chunk, that value isn't in the cache key
 * 3. Changing the cross-chunk style won't invalidate this chunk's cache
 * 4. Result: stale CSS output or incorrect cache hits
 *
 * Example of a violation:
 * ```
 * // flowStyle.__lookupStyles = ['display', 'flow']
 * // If 'display' is in DISPLAY chunk and 'flow' is in LAYOUT chunk:
 * // - User sets { display: 'grid', flow: 'column' }
 * // - LAYOUT chunk caches CSS with flow=column, display=grid
 * // - User changes to { display: 'flex', flow: 'column' }
 * // - LAYOUT chunk cache key unchanged (only has 'flow')
 * // - Returns stale CSS computed with display=grid!
 * ```
 *
 * Before adding/moving styles, verify:
 * 1. Find all handlers that use this style (grep for the style name in __lookupStyles)
 * 2. Ensure ALL styles from each handler's __lookupStyles are in the same chunk
 * ============================================================================
 */

import { isSelector } from '../pipeline';

// ============================================================================
// Chunk Style Lists
// ============================================================================

/**
 * Appearance chunk - visual styling with independent handlers
 */
export const APPEARANCE_CHUNK_STYLES = [
  'fill', // fillStyle (independent)
  'color', // colorStyle (independent)
  'opacity', // independent
  'border', // borderStyle (independent)
  'radius', // radiusStyle (independent)
  'outline', // outlineStyle: outline ↔ outlineOffset
  'outlineOffset', // outlineStyle: outline ↔ outlineOffset
  'shadow', // shadowStyle (independent)
  'fade', // fadeStyle (independent)
] as const;

/**
 * Font chunk - typography styles
 *
 * Handler dependencies (all styles in each handler MUST stay in this chunk):
 * ⚠️ presetStyle: preset, fontSize, lineHeight, letterSpacing, textTransform,
 *    fontWeight, fontStyle, font
 */
export const FONT_CHUNK_STYLES = [
  // All from presetStyle handler - MUST stay together
  'preset',
  'font',
  'fontWeight',
  'fontStyle',
  'fontSize',
  'lineHeight',
  'letterSpacing',
  'textTransform',
  // Independent text styles grouped for cohesion
  'fontFamily', // independent alias (logical grouping with font styles)
  'textAlign',
  'textDecoration',
  'wordBreak',
  'wordWrap',
  'boldFontWeight',
] as const;

/**
 * Dimension chunk - sizing and spacing
 *
 * Handler dependencies (all styles in each handler MUST stay in this chunk):
 * ⚠️ paddingStyle: padding, paddingTop/Right/Bottom/Left, paddingBlock/Inline
 * ⚠️ marginStyle: margin, marginTop/Right/Bottom/Left, marginBlock/Inline
 * ⚠️ widthStyle: width, minWidth, maxWidth
 * ⚠️ heightStyle: height, minHeight, maxHeight
 */
export const DIMENSION_CHUNK_STYLES = [
  // All from paddingStyle handler - MUST stay together
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'paddingBlock',
  'paddingInline',
  // All from marginStyle handler - MUST stay together
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginBlock',
  'marginInline',
  // widthStyle handler - MUST stay together
  'width',
  'minWidth',
  'maxWidth',
  // heightStyle handler - MUST stay together
  'height',
  'minHeight',
  'maxHeight',
  'flexBasis',
  'flexGrow',
  'flexShrink',
  'flex',
] as const;

/**
 * Display chunk - display mode, layout flow, text overflow, and scrollbar
 *
 * Handler dependencies (all styles in each handler MUST stay in this chunk):
 * ⚠️ displayStyle: display, hide, textOverflow, overflow, whiteSpace
 * ⚠️ flowStyle: display, flow
 * ⚠️ gapStyle: display, flow, gap
 * ⚠️ scrollbarStyle: scrollbar, overflow
 */
export const DISPLAY_CHUNK_STYLES = [
  // displayStyle handler
  'display',
  'hide',
  'textOverflow',
  'overflow', // also used by scrollbarStyle
  'whiteSpace',
  // flowStyle handler (requires display)
  'flow',
  // gapStyle handler (requires display, flow)
  'gap',
  // scrollbarStyle handler (requires overflow)
  'scrollbar',
  'styledScrollbar', // styledScrollbarStyle (deprecated)
] as const;

/**
 * Layout chunk - flex/grid alignment and grid templates
 *
 * Note: flow and gap are in DISPLAY chunk due to handler dependencies
 * (flowStyle and gapStyle both require 'display' prop).
 */
export const LAYOUT_CHUNK_STYLES = [
  // Alignment styles (all independent handlers)
  'placeItems',
  'placeContent',
  'alignItems',
  'alignContent',
  'justifyItems',
  'justifyContent',
  'align', // alignStyle (independent)
  'justify', // justifyStyle (independent)
  'place', // placeStyle (independent)
  'columnGap',
  'rowGap',
  // Grid template styles
  'gridColumns',
  'gridRows',
  'gridTemplate',
  'gridAreas',
  'gridAutoFlow',
  'gridAutoColumns',
  'gridAutoRows',
] as const;

/**
 * Position chunk - element positioning
 *
 * Handler dependencies (all styles in each handler MUST stay in this chunk):
 * ⚠️ insetStyle: inset, insetBlock, insetInline, top, right, bottom, left
 */
export const POSITION_CHUNK_STYLES = [
  'position',
  // All from insetStyle handler - MUST stay together
  'inset',
  'insetBlock',
  'insetInline',
  'top',
  'right',
  'bottom',
  'left',
  'zIndex',
  'gridArea',
  'gridColumn',
  'gridRow',
  'order',
  'placeSelf',
  'alignSelf',
  'justifySelf',
  'transform',
  'transition',
  'animation',
] as const;

// ============================================================================
// Chunk Names
// ============================================================================

export const CHUNK_NAMES = {
  /** Special chunk for styles that cannot be split (e.g., @starting-style) */
  COMBINED: 'combined',
  SUBCOMPONENTS: 'subcomponents',
  APPEARANCE: 'appearance',
  FONT: 'font',
  DIMENSION: 'dimension',
  DISPLAY: 'display',
  LAYOUT: 'layout',
  POSITION: 'position',
  MISC: 'misc',
} as const;

export type ChunkName = (typeof CHUNK_NAMES)[keyof typeof CHUNK_NAMES];

// ============================================================================
// Style-to-Chunk Lookup Map (O(1) categorization)
// ============================================================================

/**
 * Pre-computed map for O(1) style-to-chunk lookup.
 * Built once at module load time.
 */
export const STYLE_TO_CHUNK: Map<string, ChunkName> = new Map();

// Populate the lookup map
function populateStyleToChunkMap() {
  for (const style of APPEARANCE_CHUNK_STYLES) {
    STYLE_TO_CHUNK.set(style, CHUNK_NAMES.APPEARANCE);
  }
  for (const style of FONT_CHUNK_STYLES) {
    STYLE_TO_CHUNK.set(style, CHUNK_NAMES.FONT);
  }
  for (const style of DIMENSION_CHUNK_STYLES) {
    STYLE_TO_CHUNK.set(style, CHUNK_NAMES.DIMENSION);
  }
  for (const style of DISPLAY_CHUNK_STYLES) {
    STYLE_TO_CHUNK.set(style, CHUNK_NAMES.DISPLAY);
  }
  for (const style of LAYOUT_CHUNK_STYLES) {
    STYLE_TO_CHUNK.set(style, CHUNK_NAMES.LAYOUT);
  }
  for (const style of POSITION_CHUNK_STYLES) {
    STYLE_TO_CHUNK.set(style, CHUNK_NAMES.POSITION);
  }
}

// Initialize at module load
populateStyleToChunkMap();

// ============================================================================
// Chunk Priority Order
// ============================================================================

/**
 * Chunk processing order. This ensures deterministic className allocation
 * regardless of style key order in the input.
 */
const CHUNK_ORDER: readonly string[] = [
  CHUNK_NAMES.APPEARANCE,
  CHUNK_NAMES.FONT,
  CHUNK_NAMES.DIMENSION,
  CHUNK_NAMES.DISPLAY,
  CHUNK_NAMES.LAYOUT,
  CHUNK_NAMES.POSITION,
  CHUNK_NAMES.MISC,
  CHUNK_NAMES.SUBCOMPONENTS,
] as const;

/**
 * Map from chunk name to its priority index for sorting.
 */
const CHUNK_PRIORITY: Map<string, number> = new Map(
  CHUNK_ORDER.map((name, index) => [name, index]),
);

// ============================================================================
// Chunk Info Interface
// ============================================================================

export interface ChunkInfo {
  /** Name of the chunk */
  name: ChunkName | string;
  /** Style keys belonging to this chunk */
  styleKeys: string[];
}

// ============================================================================
// Style Categorization
// ============================================================================

/**
 * Categorize style keys into chunks.
 *
 * Returns chunks in a deterministic order (by CHUNK_ORDER) regardless
 * of the order of keys in the input styles object.
 *
 * @param styles - The styles object to categorize
 * @returns Map of chunk name to array of style keys in that chunk (in priority order)
 */
export function categorizeStyleKeys(
  styles: Record<string, unknown>,
): Map<string, string[]> {
  // First pass: collect keys into chunks (unordered)
  const chunkData: Record<string, string[]> = {};
  const keys = Object.keys(styles);

  for (const key of keys) {
    // Skip the $ helper key (used for selector combinators)
    // Skip @keyframes and @properties (processed separately in useStyles)
    if (key === '$' || key === '@keyframes' || key === '@properties') {
      continue;
    }

    if (isSelector(key)) {
      // All selectors go into the subcomponents chunk
      if (!chunkData[CHUNK_NAMES.SUBCOMPONENTS]) {
        chunkData[CHUNK_NAMES.SUBCOMPONENTS] = [];
      }
      chunkData[CHUNK_NAMES.SUBCOMPONENTS].push(key);
    } else {
      // Look up the chunk for this style, default to misc
      const chunkName = STYLE_TO_CHUNK.get(key) ?? CHUNK_NAMES.MISC;
      if (!chunkData[chunkName]) {
        chunkData[chunkName] = [];
      }
      chunkData[chunkName].push(key);
    }
  }

  // Second pass: build ordered Map based on CHUNK_ORDER
  const orderedChunks = new Map<string, string[]>();

  // Add chunks in priority order
  for (const chunkName of CHUNK_ORDER) {
    if (chunkData[chunkName] && chunkData[chunkName].length > 0) {
      // Sort keys within chunk for consistent cache key generation
      orderedChunks.set(chunkName, chunkData[chunkName].sort());
    }
  }

  // Handle any unknown chunks (shouldn't happen, but be defensive)
  for (const chunkName of Object.keys(chunkData)) {
    if (!orderedChunks.has(chunkName)) {
      orderedChunks.set(chunkName, chunkData[chunkName].sort());
    }
  }

  return orderedChunks;
}

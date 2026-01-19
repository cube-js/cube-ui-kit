/**
 * Style chunk definitions for CSS chunking optimization.
 *
 * Styles are grouped into chunks based on:
 * 1. Handler dependencies - styles that share a handler MUST be in the same chunk
 * 2. Logical grouping - related styles grouped for better cache reuse
 *
 * See STYLE_CHUNKING_SPEC.md for detailed rationale.
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
  'outline', // outlineStyle (independent)
  'outlineOffset', // independent (used with outline)
  'shadow', // shadowStyle (independent)
  'fade', // fadeStyle (independent)
] as const;

/**
 * Font chunk - typography styles
 * ⚠️ presetStyle handler requires: preset, fontSize, lineHeight, letterSpacing,
 *    textTransform, fontWeight, fontStyle, font - all MUST stay together
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
  'whiteSpace',
  'textDecoration',
  'textOverflow',
  'wordBreak',
  'wordWrap',
  'boldFontWeight',
] as const;

/**
 * Dimension chunk - sizing and spacing
 * ⚠️ paddingStyle handler requires all padding variants together
 * ⚠️ marginStyle handler requires all margin variants together
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
  // Independent sizing styles
  'width', // widthStyle (independent)
  'height', // heightStyle (independent)
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'flexBasis',
  'flexGrow',
  'flexShrink',
  'flex',
] as const;

/**
 * Container chunk - display, flow, and grid layout
 * ⚠️ FORCED TOGETHER by transitive handler dependencies:
 *    displayStyle(display,hide) + flowStyle(display,flow) +
 *    gapStyle(display,flow,gap)
 */
export const CONTAINER_CHUNK_STYLES = [
  // Forced together by handler dependencies
  'display', // displayStyle: display ↔ hide
  'hide', // displayStyle: display ↔ hide
  'flow', // flowStyle: display ↔ flow
  'gap', // gapStyle: display ↔ flow ↔ gap
  // Related container styles (independent but logically grouped)
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
  'gridColumns',
  'gridRows',
  'gridTemplate',
  'gridAreas',
  'gridAutoFlow',
  'gridAutoColumns',
  'gridAutoRows',
] as const;

/**
 * Scrollbar chunk - scrollbar and overflow
 * ⚠️ scrollbarStyle handler requires scrollbar ↔ overflow together
 */
export const SCROLLBAR_CHUNK_STYLES = [
  'scrollbar', // scrollbarStyle: scrollbar ↔ overflow
  'overflow', // scrollbarStyle: scrollbar ↔ overflow
  'styledScrollbar', // styledScrollbarStyle (independent, deprecated)
] as const;

/**
 * Position chunk - element positioning (all independent handlers)
 */
export const POSITION_CHUNK_STYLES = [
  'position',
  'inset', // insetStyle (independent)
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
  CONTAINER: 'container',
  SCROLLBAR: 'scrollbar',
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
  for (const style of CONTAINER_CHUNK_STYLES) {
    STYLE_TO_CHUNK.set(style, CHUNK_NAMES.CONTAINER);
  }
  for (const style of SCROLLBAR_CHUNK_STYLES) {
    STYLE_TO_CHUNK.set(style, CHUNK_NAMES.SCROLLBAR);
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
  CHUNK_NAMES.CONTAINER,
  CHUNK_NAMES.SCROLLBAR,
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
    // Skip @keyframes (processed separately in useStyles)
    if (key === '$' || key === '@keyframes') {
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

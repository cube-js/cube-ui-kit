/**
 * Chunk-specific style rendering.
 *
 * Renders styles for a specific chunk by filtering the styles object
 * to only include relevant keys before passing to renderStyles.
 */

import { RenderResult, renderStyles } from '../pipeline';
import { Styles } from '../styles/types';

import { CHUNK_NAMES } from './definitions';

/**
 * Render styles for a specific chunk.
 *
 * Creates a filtered styles object containing only the keys for this chunk,
 * then delegates to the existing renderStyles function.
 *
 * @param styles - The full styles object
 * @param chunkName - Name of the chunk being rendered
 * @param styleKeys - Keys of styles belonging to this chunk
 * @returns RenderResult with rules for this chunk
 */
export function renderStylesForChunk(
  styles: Styles,
  chunkName: string,
  styleKeys: string[],
): RenderResult {
  // Empty chunk - return empty result
  if (styleKeys.length === 0) {
    return { rules: [], className: '' };
  }

  // For subcomponents, we need to preserve the nested structure
  if (chunkName === CHUNK_NAMES.SUBCOMPONENTS) {
    return renderSubcomponentsChunk(styles, styleKeys);
  }

  // For regular chunks, create a filtered styles object
  // This is memory-efficient: we only create a shallow copy with filtered keys
  const filteredStyles: Styles = {};

  for (const key of styleKeys) {
    const value = styles[key];
    if (value !== undefined) {
      filteredStyles[key] = value;
    }
  }

  // Delegate to existing renderStyles
  return renderStyles(filteredStyles);
}

/**
 * Render the subcomponents chunk.
 *
 * Subcomponents (selectors like Label, &::before, etc.) contain nested
 * style objects that need to be preserved in their entirety.
 *
 * @param styles - The full styles object
 * @param selectorKeys - Keys of selectors in this chunk
 * @returns RenderResult with rules for all subcomponents
 */
function renderSubcomponentsChunk(
  styles: Styles,
  selectorKeys: string[],
): RenderResult {
  // Create a styles object containing only the selector keys
  const filteredStyles: Styles = {};

  for (const key of selectorKeys) {
    const value = styles[key];
    if (value !== undefined) {
      filteredStyles[key] = value;
    }
  }

  // Also copy the $ helper if present (used for selector combinators)
  if (styles.$ !== undefined) {
    filteredStyles.$ = styles.$;
  }

  // Delegate to existing renderStyles
  return renderStyles(filteredStyles);
}

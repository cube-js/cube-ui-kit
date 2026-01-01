/**
 * Zero-runtime module for programmatic use.
 *
 * For the Babel plugin, import from '@cube-dev/ui-kit/tasty/zero/babel'
 *
 * @example
 * ```typescript
 * import { extractStylesWithChunks, CSSWriter } from '@cube-dev/ui-kit/tasty/zero';
 *
 * const chunks = extractStylesWithChunks({ fill: '#blue', padding: '2x' });
 * const writer = new CSSWriter('output.css');
 * chunks.forEach(chunk => writer.add(chunk.className, chunk.css));
 * writer.write();
 * ```
 */

// Core extraction utilities
export { extractStylesWithChunks, extractStylesForSelector } from './extractor';
export type { ExtractedChunk, ExtractedSelector } from './extractor';

// CSS output utilities
export { CSSWriter } from './css-writer';

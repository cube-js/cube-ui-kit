#!/usr/bin/env node
/**
 * `precompileStyles()` folds UI Kit's catalog in by default, and must render it
 * exactly as `precompile-tasty.mjs` does — otherwise an application artifact
 * would ship different class names for the same kit components than the
 * published asset, and the two could not be stacked.
 *
 * Lives here rather than in the vitest suites because it needs `dist/`: the
 * catalog imports the built kit, and `pnpm test` does not build.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const shipped = JSON.parse(
  readFileSync(resolve(ROOT, 'dist/precompiled/manifest.json'), 'utf8'),
);
const { precompileStyles } = await import(
  resolve(ROOT, 'dist/precompile/index.js')
);

const result = await precompileStyles({ id: '@cube-dev/ui-kit', cases: [] });

const mine = new Map(
  result.manifest.chunks.map(({ lookupKey, className }) => [
    lookupKey,
    className,
  ]),
);
const problems = [];

if (mine.size !== shipped.chunks.length) {
  problems.push(
    `chunk count ${mine.size} vs shipped ${shipped.chunks.length}`,
  );
}
for (const { lookupKey, className } of shipped.chunks) {
  if (mine.get(lookupKey) !== className) {
    problems.push(
      `chunk "${lookupKey}" -> ${mine.get(lookupKey) ?? '(missing)'}, shipped ${className}`,
    );
  }
}
if (result.manifest.cssHash !== shipped.cssHash) {
  problems.push(
    `cssHash ${result.manifest.cssHash} vs shipped ${shipped.cssHash}`,
  );
}

if (problems.length > 0) {
  console.error(
    'precompileStyles() no longer reproduces the shipped catalog:\n  ' +
      problems.slice(0, 10).join('\n  ') +
      (problems.length > 10 ? `\n  …and ${problems.length - 10} more` : ''),
  );
  process.exit(1);
}

console.log(
  `precompileStyles() reproduces the shipped catalog (${mine.size} chunks).`,
);

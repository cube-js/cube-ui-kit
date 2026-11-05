#!/usr/bin/env node
/**
 * Fails when the published `tasty.config.ts` lists a component token in
 * `componentTokens` that no component's docs offer consumers: no `.docs.mdx`
 * under `src/` names it as `$name`, `#name` or `--name`. The Usage guide is
 * left out, because it names a few of them only as examples of the list.
 *
 * It runs in `Lint, types & diagnostics`, which always runs: the CI planner
 * runs no test job for a PR that changes only docs pages, so a spec would miss
 * a docs edit that drops a token.
 *
 * Usage: node scripts/check-component-tokens.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

// Read the list from the source rather than importing it: the config is
// TypeScript and imports its generated lists without a file extension.
const config = readFileSync(join(ROOT, 'tasty.config.ts'), 'utf8');
const block = config.match(/export const componentTokens = \[([\s\S]*?)\n\];/);
const tokens = block
  ? [...block[1].replace(/\/\/.*$/gm, '').matchAll(/'([$#][\w-]+)'/g)].map(
      (match) => match[1],
    )
  : [];

if (tokens.length === 0) {
  console.error('tasty.config.ts: found no `export const componentTokens`.');
  process.exit(1);
}

const src = join(ROOT, 'src');
const docs = readdirSync(src, { recursive: true, encoding: 'utf8' })
  .filter(
    (file) => file.endsWith('.docs.mdx') && !file.endsWith('Usage.docs.mdx'),
  )
  .map((file) => readFileSync(join(src, file), 'utf8'))
  .join('\n');

// `$name` reads `--name`; `#name` reads `--name-color`.
const isDocumented = (token) => {
  const name = token.slice(1);
  const variable = token[0] === '#' ? `${name}-color` : name;

  return new RegExp(
    `(?<![\\w-])(?:\\${token[0]}${name}|--${variable})(?![\\w-])`,
  ).test(docs);
};

const undocumented = tokens.filter((token) => !isDocumented(token));

if (undocumented.length > 0) {
  console.error(
    `tasty.config.ts publishes component tokens that no component's docs offer: ${undocumented.join(', ')}.\n` +
      "Document each in its component's .docs.mdx, or move it to src/tasty.config.ts if it is internal.",
  );
  process.exit(1);
}

console.log(`All ${tokens.length} published component tokens are documented.`);

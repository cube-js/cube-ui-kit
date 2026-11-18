#!/usr/bin/env node
/**
 * Fails when a typography preset in `tasty.config.generated.ts` has no row in
 * the "Typography Presets" section of the Usage guide
 * (`src/stories/Usage.docs.mdx`). The guide is where agents and people look a
 * preset up, so a preset missing there is one they can't find. It checks names
 * only: a row's values are reviewed against `src/tokens/typography.ts`.
 *
 * It runs in `Lint, types & diagnostics`, which always runs: the CI planner
 * runs no test job for a PR that changes only docs pages, so a spec would miss
 * a docs edit that drops a row.
 *
 * Usage: node scripts/check-typography-presets.mjs
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

// Read the list from the source rather than importing it: the file is
// TypeScript.
const config = readFileSync(join(ROOT, 'tasty.config.generated.ts'), 'utf8');
const block = config.match(/\n {2}presets: \[([\s\S]*?)\n {2}\],/);
const presets = block
  ? [...block[1].matchAll(/'([\w-]+)'/g)].map((match) => match[1])
  : [];

if (presets.length === 0) {
  console.error('tasty.config.generated.ts: found no `presets` list.');
  process.exit(1);
}

const guide = readFileSync(join(ROOT, 'src/stories/Usage.docs.mdx'), 'utf8');
// The section ends at the next `##` heading, or at its Modifiers table, whose
// `strong` and `em` rows are not presets.
const section = guide.match(
  /\n## Typography Presets\n([\s\S]*?)(?=\n## |\n### Modifiers\n|$)/,
);

if (!section) {
  console.error(
    'src/stories/Usage.docs.mdx: found no "## Typography Presets" section.',
  );
  process.exit(1);
}

// A row starts with the preset's name as code: `| \`t3\` | 14px | …`.
const rows = new Set(
  [...section[1].matchAll(/^\| *`([\w-]+)` *\|/gm)].map((match) => match[1]),
);
const missing = presets.filter((preset) => !rows.has(preset));

if (missing.length > 0) {
  console.error(
    `The Usage guide's "Typography Presets" tables have no row for: ${missing.join(', ')}.\n` +
      'Add a row for each to src/stories/Usage.docs.mdx, with the values src/tokens/typography.ts gives it.',
  );
  process.exit(1);
}

console.log(
  `All ${presets.length} typography presets have a row in the Usage guide.`,
);

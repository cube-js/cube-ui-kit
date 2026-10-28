#!/usr/bin/env node
/**
 * Gates the third-party packages that ship in the library bundle.
 *
 * `size-limit` bundles the whole library with webpack (`.size-limit.cjs`), and
 * Statoscope writes that build's stats to `size-limit-report/stats.json`. This
 * script sums the bundled bytes of every package under `node_modules` and
 * compares them with `scripts/bundle-deps-baseline.json`, the packages last
 * approved in review. It fails, and reports, only when the dependency graph
 * changes: a package enters or leaves the bundle, or grows more than
 * `TOLERANCE` bytes past its approved size. A version bump within the
 * tolerance passes without a word. UI Kit's own code is not gated, since it
 * grows with every feature, and neither are `@tenphi/*` packages, which are
 * ours and released on their own.
 *
 * Sizes are module source bytes before minification, which are exact and the
 * same on every machine, unlike the minified, gzipped totals `size-limit`
 * reports.
 *
 *   pnpm build && pnpm size     # measure, then check the packages
 *   pnpm size --update          # approve the current packages; commit the baseline
 *
 * Growth within the tolerance is not approved, only tolerated: the next change
 * is measured against the same baseline, so creep adds up until it fails. A
 * package that left the bundle fails too, so the baseline holds only what
 * ships, and nothing returns to the bundle unreviewed.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import bytes from 'bytes';
import { markdownTable } from 'markdown-table';

const root = resolve(import.meta.dirname, '..');

export const baselinePath = resolve(root, 'scripts/bundle-deps-baseline.json');
export const TOLERANCE = 10 * 1024;
export const UPDATE_COMMAND = 'pnpm size --update';

/** The package a bundled module belongs to, or `null` for UI Kit's own code. */
export function packageOf(path) {
  // The last segment wins: pnpm nests every package under
  // `node_modules/.pnpm/<name>@<version>/node_modules/<name>/`.
  const matches = [...path.matchAll(/node_modules\/((?:@[^/]+\/)?[^/]+)/g)];
  return matches.at(-1)?.[1] ?? null;
}

/**
 * Bundled bytes per third-party package, from webpack stats. Statoscope
 * normalizes them: a chunk lists its modules by id, and the modules sit under
 * `__statoscope.normalization` as `[id, module]` pairs. A concatenated module
 * carries the modules webpack merged into it inline. Plain webpack stats, with
 * module objects in place of ids, read the same way.
 */
export function packageSizes(stats) {
  const [compilation] =
    stats.__statoscope?.normalization?.data?.compilations ?? [];
  const byId = new Map(compilation?.data?.modules ?? []);
  const seen = new Set();
  const sizes = {};

  const visit = (ref) => {
    const module = typeof ref === 'number' ? byId.get(ref) : ref;
    if (!module) {
      throw new Error(`Module ${ref} is referenced but not in the stats.`);
    }
    if (module.modules?.length) {
      for (const inner of module.modules) visit(inner);
      return;
    }
    const key = module.identifier ?? module.name;
    if (seen.has(key)) return;
    seen.add(key);
    const name = packageOf(module.nameForCondition ?? module.name ?? '');
    if (name && !name.startsWith('@tenphi/')) {
      sizes[name] = (sizes[name] ?? 0) + (module.size ?? 0);
    }
  };

  for (const chunk of stats.chunks ?? []) {
    for (const ref of chunk.modules ?? []) visit(ref);
  }

  if (!Object.keys(sizes).length) {
    throw new Error(
      'Found no third-party packages in the bundle stats. Either the stats are not from size-limit, or their format changed.',
    );
  }

  return sortedByName(sizes);
}

/**
 * The changes that need approval: a package that entered or left the bundle,
 * or grew more than `tolerance` bytes past its approved size.
 */
export function unapprovedChanges(current, approved, tolerance = TOLERANCE) {
  const names = [
    ...new Set([...Object.keys(approved), ...Object.keys(current)]),
  ];

  return names
    .map((name) => {
      const before = approved[name];
      const after = current[name];
      const status =
        before === undefined
          ? 'new'
          : after === undefined
            ? 'removed'
            : after - before > tolerance
              ? 'grown'
              : null;

      return { name, before, after, status };
    })
    .filter(({ status }) => status)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** The Markdown section the size report and the PR comment show. */
export function formatPackageReport(changes) {
  const limit = formatSize(TOLERANCE);

  if (!changes.length) {
    return `✅ No third-party package entered or left the bundle, and none grew more than ${limit} past its approved size.`;
  }

  const subject =
    changes.length === 1
      ? 'A third-party package needs approval**: it'
      : `${changes.length} third-party packages need approval**: each`;

  return [
    `❌ **${subject} entered or left the bundle, or grew more than ${limit} past its approved size. If that is intended, run \`${UPDATE_COMMAND}\`, commit \`scripts/bundle-deps-baseline.json\`, and say why in the PR.`,
    '',
    markdownTable([
      ['Package', 'Approved', 'Now', 'Change'],
      ...changes.map(({ name, before, after, status }) => [
        `\`${name}\``,
        formatSize(before),
        formatSize(after),
        status === 'new'
          ? 'new in the bundle'
          : status === 'removed'
            ? 'left the bundle'
            : `+${formatSize(after - before)}`,
      ]),
    ]),
  ].join('\n');
}

export function formatSize(size) {
  return size === undefined ? '—' : bytes.format(size, { unitSeparator: ' ' });
}

export function readStats(reportFolder) {
  return JSON.parse(readFileSync(join(reportFolder, 'stats.json'), 'utf8'));
}

export function readBaseline() {
  return JSON.parse(readFileSync(baselinePath, 'utf8'));
}

function writeBaseline(sizes) {
  writeFileSync(baselinePath, `${JSON.stringify(sizes, null, 2)}\n`);
}

function sortedByName(object) {
  return Object.fromEntries(
    Object.entries(object).sort(([a], [b]) => a.localeCompare(b)),
  );
}

function main() {
  const update = process.argv.includes('--update');
  const current = packageSizes(
    readStats(process.env.REPORT_FOLDER ?? join(root, 'size-limit-report')),
  );

  if (update) {
    writeBaseline(current);
    console.log(
      `Approved ${Object.keys(current).length} third-party packages in scripts/bundle-deps-baseline.json.`,
    );
    return;
  }

  const changes = unapprovedChanges(current, readBaseline());
  console.log(formatPackageReport(changes));
  if (changes.length) process.exitCode = 1;
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
)
  main();

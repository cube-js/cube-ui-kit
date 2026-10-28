#!/usr/bin/env node
/**
 * Gates the third-party packages that ship in the library bundle.
 *
 * `size-limit` bundles the whole library with webpack (`.size-limit.cjs`), and
 * Statoscope writes that build's stats to `size-limit-report/stats.json`. This
 * script sums the bundled bytes of every package under `node_modules` and
 * compares them with `scripts/bundle-deps-baseline.json`, the sizes last
 * approved in review. It fails when a package enters the bundle, or when one
 * has grown more than `TOLERANCE` bytes beyond its approved size. UI Kit's own
 * code is not gated: it grows with every feature, and the PR comment reports
 * the total.
 *
 * Sizes are module source bytes before minification, which are exact and the
 * same on every machine, unlike the minified, gzipped totals `size-limit`
 * reports. `@tenphi/*` packages are ours and released on their own, so they
 * are reported but never fail the check.
 *
 *   pnpm build && pnpm size     # measure, then check the packages
 *   pnpm size --update          # approve the current sizes; commit the baseline
 *
 * Growth within the tolerance is not approved, it is only tolerated: the next
 * change is measured against the same baseline, so creep adds up until someone
 * runs `--update` and says why in the PR.
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

export function isGated(name) {
  return !name.startsWith('@tenphi/');
}

/**
 * Bundled bytes per package, from webpack stats. Statoscope normalizes them:
 * modules are written once, as `[id, module]` pairs under
 * `__statoscope.normalization`, and referenced by id everywhere else. Plain
 * webpack stats, with module objects in place of ids, read the same way.
 */
export function packageSizes(stats) {
  const compilations =
    stats.__statoscope?.normalization?.data?.compilations ?? [];
  const compilation =
    compilations.find(({ id }) => id === stats.hash) ?? compilations[0];
  const byId = new Map(compilation?.data?.modules ?? []);
  const seen = new Set();
  const sizes = {};

  const visit = (ref) => {
    const module = typeof ref === 'number' ? byId.get(ref) : ref;
    if (!module) {
      throw new Error(`Module ${ref} is referenced but not in the stats.`);
    }
    // A concatenated module lists the modules webpack merged into it.
    if (module.modules?.length) {
      for (const inner of module.modules) visit(inner);
      return;
    }
    const key = module.identifier ?? module.name;
    if (seen.has(key)) return;
    seen.add(key);
    const name = packageOf(module.nameForCondition ?? module.name ?? '');
    if (name) sizes[name] = (sizes[name] ?? 0) + (module.size ?? 0);
  };

  for (const chunk of stats.chunks ?? []) {
    for (const ref of chunk.modules ?? []) visit(ref);
  }

  if (!Object.keys(sizes).length) {
    throw new Error(
      'Found no node_modules packages in the bundle stats. Either the stats are not from size-limit, or their format changed.',
    );
  }

  return sortedByName(sizes);
}

/**
 * Every package whose size differs from the baseline. `blocking` marks what
 * fails the check: a gated package that is new, or grown past the tolerance.
 */
export function compareSizes(current, approved, tolerance = TOLERANCE) {
  const names = [
    ...new Set([...Object.keys(approved), ...Object.keys(current)]),
  ];

  return names
    .filter((name) => current[name] !== approved[name])
    .map((name) => {
      const before = approved[name];
      const after = current[name];
      const status =
        after === undefined
          ? 'removed'
          : before === undefined
            ? 'new'
            : after - before > tolerance
              ? 'grown'
              : after > before
                ? 'within tolerance'
                : 'smaller';
      const blocking =
        isGated(name) && (status === 'new' || status === 'grown');

      return { name, before, after, status, blocking };
    })
    .sort(
      (a, b) =>
        Number(b.blocking) - Number(a.blocking) || a.name.localeCompare(b.name),
    );
}

/** The Markdown section the size report and the PR comment show. */
export function formatPackageReport(changes) {
  const blocking = changes.filter((change) => change.blocking);
  const lines = [];

  if (blocking.length) {
    const subject =
      blocking.length === 1
        ? 'A third-party package needs approval**: it is'
        : `${blocking.length} third-party packages need approval**: each is`;

    lines.push(
      `❌ **${subject} new in the bundle, or more than ${formatSize(TOLERANCE)} over its approved size. If the growth is intended, run \`${UPDATE_COMMAND}\`, commit \`scripts/bundle-deps-baseline.json\`, and say why in the PR.`,
    );
  } else {
    lines.push(
      '✅ No third-party package entered the bundle or grew past its approved size.',
    );
  }

  if (changes.length) {
    lines.push(
      '',
      markdownTable([
        ['Package', 'Approved', 'Now', 'Change'],
        ...changes.map(({ name, before, after, status, blocking }) => [
          `\`${name}\``,
          formatSize(before),
          formatSize(after),
          `${describeChange(before, after, status)}${
            blocking ? ' ❌' : isGated(name) ? '' : ' (not gated)'
          }`,
        ]),
      ]),
    );
  }

  return lines.join('\n');
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

function describeChange(before, after, status) {
  if (status === 'new') return 'new in the bundle';
  if (status === 'removed') return 'left the bundle';
  const delta = after - before;
  return `${delta > 0 ? '+' : '−'}${formatSize(Math.abs(delta))}`;
}

function formatSize(size) {
  return size === undefined ? '—' : bytes.format(size, { unitSeparator: ' ' });
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
      `Approved the bundled size of ${Object.keys(current).length} packages in scripts/bundle-deps-baseline.json.`,
    );
    return;
  }

  const changes = compareSizes(current, readBaseline());
  console.log(formatPackageReport(changes));
  if (changes.some((change) => change.blocking)) process.exitCode = 1;
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
)
  main();

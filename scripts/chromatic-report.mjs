#!/usr/bin/env node
/**
 * `pnpm chromatic:report` — what a Chromatic build actually costs, and why.
 *
 * Chromatic bills per snapshot, and a snapshot is one story. Two numbers decide
 * the bill:
 *
 *   1. How many stories get snapshotted at all (`--snapshots`). A story opted
 *      out with `parameters.chromatic.disableSnapshot` still renders in
 *      Storybook and still appears in the docs — it just is not photographed.
 *   2. How much of the suite a single changed file drags in (`--turbosnap`).
 *      TurboSnap (`onlyChanged: true`) reruns only the stories that depend on
 *      the files a PR touched, so the blast radius of a common import is the
 *      difference between a 40-snapshot build and a full one.
 *
 * Both read `storybook-static/preview-stats.json`, the module graph Storybook
 * writes with `--stats-json`, which is the same file Chromatic uploads and
 * traces. Build it first:
 *
 *   pnpm build-storybook
 *
 * Usage:
 *   node scripts/chromatic-report.mjs                    # both reports
 *   node scripts/chromatic-report.mjs --snapshots        # snapshot inventory
 *   node scripts/chromatic-report.mjs --turbosnap        # blast-radius report
 *   node scripts/chromatic-report.mjs --trace <file...>  # affected stories for specific files
 *   node scripts/chromatic-report.mjs --check            # exit 1 if a budget is exceeded
 *   node scripts/chromatic-report.mjs --json             # machine-readable
 *
 * `--check` is the regression guard wired into CI: it fails when the set of
 * files that force a *full* build grows past `FULL_BUILD_BUDGET`. That set is
 * everything `.storybook/preview.jsx` transitively imports — a global decorator
 * genuinely affects every story, so Chromatic cannot scope such a change and
 * falls back to snapshotting all of them. One careless barrel import inside
 * that closure (`import { Button } from '../../actions'`) pulls the whole
 * library into it and silently turns every PR into a full build.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isOptedOut, sourceReader } from './lib/story-snapshots.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STATS = resolve(ROOT, 'storybook-static/preview-stats.json');
const INDEX = resolve(ROOT, 'storybook-static/index.json');

/**
 * The Storybook config module every story implicitly depends on. Chromatic
 * treats a change reaching this file as unscopeable and runs a full build.
 */
const PREVIEW = './.storybook/preview.jsx';

/**
 * Ceiling for the number of `src/` modules reachable from `preview.jsx`.
 *
 * Lower is better: every module in that closure is a file whose change costs a
 * full-suite build. The floor is not zero — `Root` is a real global decorator
 * and drags in the token/palette/i18n/overlay-provider stack by necessity — but
 * it must not creep back up to "most of the library". Raise this deliberately,
 * with a note saying which module was added and why it has to be global.
 */
const FULL_BUILD_BUDGET = 170;

/**
 * Ceiling for the share of story files a single component change may affect.
 *
 * Measured over library modules that are *not* already full-build triggers.
 * Some breadth is legitimate — `Button` appears in half the stories as demo
 * content — but a p90 near 100% means TurboSnap is buying nothing.
 */
const P90_BLAST_BUDGET = 0.6;

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const json = has('--json');
const traceIdx = args.indexOf('--trace');
const traceFiles =
  traceIdx === -1
    ? []
    : args.slice(traceIdx + 1).filter((a) => !a.startsWith('--'));

function readJson(path, what) {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    console.error(
      `Cannot read ${what} at ${path}.\nRun \`pnpm build-storybook\` first — it writes both files via --stats-json.`,
    );
    process.exit(2);
  }
}

// ─── Module graph ────────────────────────────────────────────────────────────

/**
 * `preview-stats.json` records, per module, the modules that imported it
 * (`reasons`). Invert that once into both directions: `imports` to walk from a
 * module to what it pulls in, `importedBy` to walk from a changed file to the
 * stories that would have to be re-snapshotted.
 */
function buildGraph(stats) {
  const imports = new Map();
  const importedBy = new Map();
  const link = (map, from, to) => {
    let set = map.get(from);
    if (!set) map.set(from, (set = new Set()));
    set.add(to);
  };

  for (const module of stats.modules ?? []) {
    for (const reason of module.reasons ?? []) {
      if (!reason.moduleName) continue;
      link(imports, reason.moduleName, module.name);
      link(importedBy, module.name, reason.moduleName);
    }
  }

  return { imports, importedBy };
}

function reachable(edges, start) {
  const seen = new Set();
  const queue = [start];

  while (queue.length) {
    for (const next of edges.get(queue.pop()) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }

  return seen;
}

const isStoryModule = (name) => /\.stories\.[jt]sx?$/.test(name);
const isDocsModule = (name) => /\.docs\.mdx$/.test(name);
const isSrc = (name) => name.startsWith('./src/');
const isLibrary = (name) =>
  isSrc(name) && !isStoryModule(name) && !isDocsModule(name);

// ─── Snapshot inventory ──────────────────────────────────────────────────────

/**
 * Which stories Chromatic photographs.
 *
 * `index.json` is the built story index — `type: 'story'` entries are the
 * billable ones (Chromatic skips `type: 'docs'`). The opt-outs are not in the
 * index, because `parameters.chromatic` is evaluated in the browser, so read
 * them from source instead: a story file that sets `disableSnapshot` per story
 * names the story next to it, and `meta.parameters` covers the whole file.
 */
function snapshotInventory() {
  const index = readJson(INDEX, 'the Storybook index');
  const entries = Object.values(index.entries ?? {});
  const stories = entries.filter((e) => e.type === 'story');
  const docs = entries.filter((e) => e.type === 'docs');

  const sourceOf = sourceReader(ROOT);

  const byFile = new Map();
  const optedOut = [];

  for (const story of stories) {
    const file = story.importPath.replace(/^\.\//, '');
    const skipped = isOptedOut(sourceOf(story.importPath), story.exportName);
    if (skipped) optedOut.push(story);

    let bucket = byFile.get(file);
    if (!bucket) byFile.set(file, (bucket = { total: 0, snapshotted: 0 }));
    bucket.total++;
    if (!skipped) bucket.snapshotted++;
  }

  // `isOptedOut` recognises specific spellings, so an opt-out written some other
  // way (assigned through an alias, spread from a shared object) would be
  // counted as billable and quietly break this report. Cross-check the count
  // against how many times each file actually mentions `NO_SNAPSHOT`, ignoring
  // the import, and surface the difference instead of guessing.
  const unrecognised = [];
  for (const [file, counts] of byFile) {
    const source = sourceOf(file);
    const mentions = (
      source.replace(/^import .*NO_SNAPSHOT.*$/gm, '').match(/NO_SNAPSHOT/g) ??
      []
    ).length;
    const detected = counts.total - counts.snapshotted;
    if (mentions > detected) unrecognised.push({ file, mentions, detected });
  }

  return { stories, docs, byFile, optedOut, unrecognised };
}

function reportSnapshots(result) {
  const { stories, docs, byFile, optedOut, unrecognised } = snapshotInventory();
  const billable = stories.length - optedOut.length;

  result.snapshots = {
    storyEntries: stories.length,
    optedOut: optedOut.length,
    billableSnapshots: billable,
    docsEntries: docs.length,
    storyFiles: byFile.size,
    unrecognisedOptOuts: unrecognised,
  };

  if (json) return;

  console.log('── Snapshot inventory ' + '─'.repeat(56));
  console.log(`  stories                            : ${stories.length}`);
  console.log(`  opted out (NO_SNAPSHOT)            : ${optedOut.length}`);
  console.log(`  billable snapshots per full build  : ${billable}`);
  console.log(`  docs entries (never snapshotted)   : ${docs.length}`);
  console.log(`  story files                        : ${byFile.size}`);
  console.log('');
  console.log('  Largest story files (snapshotted / total):');
  for (const [file, counts] of [...byFile]
    .sort((a, b) => b[1].snapshotted - a[1].snapshotted)
    .slice(0, 15)) {
    console.log(
      `    ${String(counts.snapshotted).padStart(3)} / ${String(counts.total).padEnd(3)}  ${file}`,
    );
  }
  console.log('');

  if (unrecognised.length) {
    console.log('  Opt-outs this report could not attribute to a story:');
    for (const { file, mentions, detected } of unrecognised) {
      console.log(`    ${file} — ${mentions} mentions, ${detected} matched`);
    }
    console.log(
      '    Write the opt-out as `Story.parameters = NO_SNAPSHOT;` or as a',
    );
    console.log(
      "    `...NO_SNAPSHOT` spread inside the story's own `parameters`.",
    );
    console.log('');
  }
}

// ─── TurboSnap blast radius ──────────────────────────────────────────────────

function reportTurbosnap(result) {
  const stats = readJson(STATS, 'the Storybook module graph');
  const { imports, importedBy } = buildGraph(stats);

  const fullBuildClosure = [...reachable(imports, PREVIEW)]
    .filter(isSrc)
    .sort();
  const fullBuildSet = new Set(fullBuildClosure);

  const allModules = new Set([...imports.keys(), ...importedBy.keys()]);
  const libraryModules = [...allModules].filter(isLibrary);
  const storyFileCount = new Set(
    [...allModules].filter((m) => isStoryModule(m) || isDocsModule(m)),
  ).size;

  const scoped = [];
  for (const module of libraryModules) {
    if (fullBuildSet.has(module)) continue;
    const affected = [...reachable(importedBy, module)].filter(
      (m) => isStoryModule(m) || isDocsModule(m),
    );
    scoped.push({ module, affected: affected.length });
  }
  scoped.sort((a, b) => b.affected - a.affected);

  const shares = scoped
    .map((s) => s.affected / storyFileCount)
    .sort((a, b) => a - b);
  const p90 = shares.length ? shares[Math.floor(shares.length * 0.9)] : 0;

  result.turbosnap = {
    libraryModules: libraryModules.length,
    storyFiles: storyFileCount,
    fullBuildTriggers: fullBuildClosure.length,
    fullBuildBudget: FULL_BUILD_BUDGET,
    p90BlastShare: Number(p90.toFixed(3)),
    p90BlastBudget: P90_BLAST_BUDGET,
    worstOffenders: scoped.slice(0, 20),
  };

  if (json) return;

  const pct = (n) => `${(n * 100).toFixed(0)}%`;
  console.log('── TurboSnap blast radius ' + '─'.repeat(52));
  console.log(`  library modules in graph : ${libraryModules.length}`);
  console.log(`  story files in graph     : ${storyFileCount}`);
  console.log('');
  console.log(
    `  full-build triggers      : ${fullBuildClosure.length} / ${libraryModules.length}` +
      ` (${pct(fullBuildClosure.length / libraryModules.length)})  budget ${FULL_BUILD_BUDGET}`,
  );
  console.log(
    '    ↳ modules reachable from .storybook/preview.jsx. Changing any of them',
  );
  console.log('      re-snapshots the entire suite.');
  console.log('');
  console.log(
    `  p90 blast radius         : ${pct(p90)} of story files   budget ${pct(P90_BLAST_BUDGET)}`,
  );
  console.log('');
  console.log(
    '  Widest scoped modules (story files affected by a one-file change):',
  );
  for (const { module, affected } of scoped.slice(0, 15)) {
    console.log(
      `    ${String(affected).padStart(4)}  ${pct(affected / storyFileCount).padStart(4)}  ${module}`,
    );
  }
  console.log('');
}

// ─── Trace ───────────────────────────────────────────────────────────────────

function reportTrace(files) {
  const stats = readJson(STATS, 'the Storybook module graph');
  const { imports, importedBy } = buildGraph(stats);
  const fullBuildSet = new Set([...reachable(imports, PREVIEW)].filter(isSrc));

  for (const file of files) {
    const module = file.startsWith('./') ? file : `./${file}`;
    console.log(`── ${module}`);

    if (fullBuildSet.has(module)) {
      console.log('   FULL BUILD — reachable from .storybook/preview.jsx.');
      console.log('   Every story is re-snapshotted when this file changes.\n');
      continue;
    }

    if (!imports.has(module) && !importedBy.has(module)) {
      console.log(
        '   not in the Storybook module graph (no story imports it)\n',
      );
      continue;
    }

    const affected = [...reachable(importedBy, module)]
      .filter((m) => isStoryModule(m) || isDocsModule(m))
      .sort();
    console.log(`   ${affected.length} affected story files:`);
    for (const a of affected) console.log(`     ${a}`);
    console.log('');
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

const result = {};

if (traceFiles.length) {
  reportTrace(traceFiles);
  process.exit(0);
}

const wantSnapshots =
  has('--snapshots') || (!has('--turbosnap') && !has('--check'));
const wantTurbosnap =
  has('--turbosnap') || has('--check') || !has('--snapshots');

if (wantSnapshots) reportSnapshots(result);
if (wantTurbosnap) reportTurbosnap(result);

if (json) {
  console.log(JSON.stringify(result, null, 2));
}

if (has('--check')) {
  const { fullBuildTriggers, p90BlastShare } = result.turbosnap;
  const failures = [];

  if (fullBuildTriggers > FULL_BUILD_BUDGET) {
    failures.push(
      `${fullBuildTriggers} modules force a full Chromatic build (budget ${FULL_BUILD_BUDGET}).\n` +
        `  Something new is reachable from .storybook/preview.jsx — usually a barrel\n` +
        `  import (\`from '../../actions'\`) inside the Root decorator's dependency tree.\n` +
        `  Run \`node scripts/chromatic-report.mjs --turbosnap\` and import the file directly.`,
    );
  }

  if (p90BlastShare > P90_BLAST_BUDGET) {
    failures.push(
      `p90 blast radius is ${(p90BlastShare * 100).toFixed(0)}% of story files (budget ${(P90_BLAST_BUDGET * 100).toFixed(0)}%).`,
    );
  }

  if (failures.length) {
    console.error('\nChromatic budget check failed:\n');
    for (const f of failures) console.error(`- ${f}\n`);
    process.exit(1);
  }

  console.log('Chromatic budget check passed.');
}

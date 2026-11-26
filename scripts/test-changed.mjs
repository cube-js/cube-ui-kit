#!/usr/bin/env node
/**
 * Runs only the unit tests for the changed surface.
 *
 * The changed surface is every file that differs between the working tree and
 * the merge base with the base branch (default `origin/main`, or the branch
 * named by `--base`, or `$GITHUB_BASE_REF`). That is exactly what merging
 * would change, including uncommitted edits and untracked files.
 *
 * For each changed file the script walks the relative import graph of `src`
 * and selects every test file that transitively imports it. A changed test
 * file selects itself. A file no job reads — specs, docs, repository notes —
 * selects nothing, and the run is a no-op success. Anything the graph cannot
 * describe (config, dependencies, the suite setup) selects the full suite:
 * the default is to test more, never less.
 *
 * Usage:
 *   node scripts/test-changed.mjs [--base <ref>] [-- <vitest args>]
 *
 * With no changed surface at all the suite is skipped and the exit code is 0.
 * Any extra arguments after `--` are passed to vitest verbatim.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

/** Files whose change invalidates the whole suite, not one surface. */
const FULL_SUITE = [
  /^package\.json$/,
  /^pnpm-lock\.yaml$/,
  /^pnpm-workspace\.yaml$/,
  /^tsconfig.*\.json$/,
  /^vitest\..*\.config\.ts$/,
  /^vitest\.config\.ts$/,
  /^src\/test\/setup\.ts$/,
  /^\.github\//,
];

const SRC_EXT = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

function git(...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function changedFiles(base) {
  let baseRef = base;
  if (!baseRef) {
    const refs = ['origin/main', 'main'];
    baseRef = refs.find((r) => {
      try {
        git('rev-parse', '--verify', '--quiet', r);
        return true;
      } catch {
        return false;
      }
    });
  }
  let diff;
  if (baseRef) {
    const mergeBase = git('merge-base', baseRef, 'HEAD');
    // Tracked changes vs the merge base, plus untracked files (git diff does
    // not list them).
    diff = git('diff', '--name-only', mergeBase);
  } else {
    // No base to compare against: the working tree is the surface.
    diff = git('status', '--porcelain', '-z')
      .split('\0')
      .filter(Boolean)
      .map((line) => line.slice(3))
      .join('\n');
  }
  const untracked = git('ls-files', '--others', '--exclude-standard');
  return [...new Set([...diff.split('\n'), ...untracked.split('\n')].filter(Boolean))];
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  const target = resolve(dirname(fromFile), specifier);
  const candidates = [
    target,
    ...SRC_EXT.map((ext) => target + ext),
    ...SRC_EXT.map((ext) => join(target, `index${ext}`)),
  ];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}

const IMPORT_RE = /(?:import|export)[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]/g;

function importsOf(file) {
  const source = readFileSync(file, 'utf8');
  const specifiers = [];
  for (const match of source.matchAll(IMPORT_RE)) {
    specifiers.push(match[1] ?? match[2]);
  }
  return specifiers;
}

function buildGraph() {
  const files = [...walk(join(root, 'src'))].filter((f) =>
    /\.(ts|tsx|js|jsx)$/.test(f),
  );
  const importers = new Map(); // file -> set of files that import it
  for (const file of files) {
    for (const specifier of importsOf(file)) {
      const target = resolveImport(file, specifier);
      if (!target) continue;
      if (!importers.has(target)) importers.set(target, new Set());
      importers.get(target).add(file);
    }
  }
  return { files, importers };
}

function testFilesImporting(seedFiles, importers) {
  const selected = new Set(seedFiles.filter((f) => /\.test\.tsx?$/.test(f)));
  const queue = [...seedFiles];
  while (queue.length > 0) {
    const file = queue.pop();
    for (const importer of importers.get(file) ?? []) {
      if (selected.has(importer)) continue;
      selected.add(importer);
      queue.push(importer);
    }
  }
  return [...selected].filter((f) => /\.test\.tsx?$/.test(f) && !/\.browser\.test\.tsx?$/.test(f));
}

function selectTests(files, { fullSuite = false } = {}) {
  if (fullSuite) return null; // null means "run everything"
  const full = files.some((f) => FULL_SUITE.some((re) => re.test(f)));
  if (full) return null;

  const { files: srcFiles, importers } = buildGraph();
  const byRel = new Map(srcFiles.map((f) => [relative(root, f), f]));
  const seeds = [];
  let unknown = false;
  for (const file of files) {
    if (!file.startsWith('src/')) continue; // docs, notes, scripts: no surface
    const abs = byRel.get(file);
    if (!abs) {
      // A src file that does not parse (or a deleted/renamed file) is not
      // safely classifiable.
      unknown = true;
      continue;
    }
    seeds.push(abs);
  }
  if (unknown) return null;
  const selected = testFilesImporting(seeds, importers);
  return selected;
}

function main(argv) {
  const args = [...argv];
  let base = process.env.GITHUB_BASE_REF
    ? `origin/${process.env.GITHUB_BASE_REF}`
    : undefined;
  const passthrough = [];
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === '--base') {
      base = args[i + 1];
      i += 2;
    } else if (arg === '--') {
      passthrough.push(...args.slice(i + 1));
      break;
    } else {
      passthrough.push(arg);
      i += 1;
    }
  }

  const files = changedFiles(base);
  console.log(`test-changed: ${files.length} changed file(s)`);
  for (const f of files) console.log(`  ${f}`);

  const selected = selectTests(files);
  if (selected === null) {
    console.log('test-changed: full suite selected');
    return spawnSync('pnpm', ['vitest', 'run', ...passthrough], {
      cwd: root,
      stdio: 'inherit',
    }).status ?? 1;
  }
  if (selected.length === 0) {
    console.log('test-changed: no tests on the changed surface; skipping');
    return 0;
  }
  console.log(`test-changed: running ${selected.length} test file(s)`);
  for (const f of selected) console.log(`  ${relative(root, f)}`);
  return spawnSync(
    'pnpm',
    ['vitest', 'run', ...selected.map((f) => relative(root, f)), ...passthrough],
    { cwd: root, stdio: 'inherit' },
  ).status ?? 1;
}

process.exit(main(process.argv.slice(2)));

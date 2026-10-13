#!/usr/bin/env node
/**
 * Runs the full jsdom suite (`pnpm test`) unless this exact tree has already
 * passed it. The pre-push hook calls it with `--pre-push`, so pushing a tree
 * that `pnpm test:once`, or an earlier push, already tested skips the rerun.
 *
 * A run is reused by content only, never by which files changed: the same git
 * tree, Node version and installed dependencies, on a working tree with no
 * changes and no untracked files, so every file Vitest collects is one that
 * passed. Whatever it cannot establish, it runs the suite for.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const DELETED = /^0+$/;

/** The local shas a push sends, from git's pre-push input; a deletion sends none. */
export function parsePushedShas(input) {
  return input
    .split('\n')
    .map((line) => line.trim().split(/\s+/)[1])
    .filter((sha) => sha && !DELETED.test(sha));
}

/** Whether the passed run recorded in `stamp` covers `state` and every pushed tree. */
export function canSkip({ stamp, state, pushedTrees }) {
  return (
    stamp != null &&
    state.clean &&
    stamp.tree === state.tree &&
    stamp.key === state.key &&
    pushedTrees.every((tree) => tree === state.tree)
  );
}

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

/** Whether the working tree is clean, its tree, and what else a run depends on. */
function readState(cwd) {
  const installed = readFileSync(resolve(cwd, 'node_modules/.pnpm/lock.yaml'));
  const installHash = createHash('sha256').update(installed).digest('hex');

  return {
    clean: git(cwd, 'status', '--porcelain') === '',
    tree: git(cwd, 'rev-parse', 'HEAD^{tree}'),
    key: `${process.version} ${installHash}`,
  };
}

/** Per worktree, inside the git directory, so it never shows up as a change. */
function stampPath(cwd) {
  return resolve(cwd, git(cwd, 'rev-parse', '--git-path', 'test-once.json'));
}

function readPushedTrees(input, cwd) {
  return parsePushedShas(input).map((sha) =>
    git(cwd, 'rev-parse', `${sha}^{tree}`),
  );
}

function attempt(fn) {
  try {
    return fn();
  } catch {
    return null;
  }
}

function sameCleanState(a, b) {
  return a?.clean && b?.clean && a.tree === b.tree && a.key === b.key;
}

function runSuite(cwd) {
  return (
    spawnSync('pnpm', ['test'], {
      cwd,
      stdio: ['ignore', 'inherit', 'inherit'],
    }).status ?? 1
  );
}

function readInput() {
  return process.stdin.isTTY ? '' : readFileSync(0, 'utf8');
}

export function main(
  args,
  { cwd = root, run = runSuite, input = readInput } = {},
) {
  const before = attempt(() => readState(cwd));
  const pushedTrees = args.includes('--pre-push')
    ? attempt(() => readPushedTrees(input(), cwd))
    : [];
  const stamp = attempt(() => JSON.parse(readFileSync(stampPath(cwd), 'utf8')));

  if (before && pushedTrees && canSkip({ stamp, state: before, pushedTrees })) {
    console.log(
      `test-once: the full jsdom suite already passed on tree ${before.tree.slice(0, 8)}; skipping it.`,
    );

    return 0;
  }

  const status = run(cwd);
  // A file edited while the suite ran leaves a result for a tree no one has.
  const after = status === 0 ? attempt(() => readState(cwd)) : null;

  if (sameCleanState(before, after)) {
    attempt(() =>
      writeFileSync(
        stampPath(cwd),
        JSON.stringify({ tree: after.tree, key: after.key }),
      ),
    );
  }

  return status;
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
)
  process.exit(main(process.argv.slice(2)));

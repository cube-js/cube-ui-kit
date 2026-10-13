#!/usr/bin/env node
/**
 * Runs the full jsdom suite (`pnpm test`) unless this exact tree has already
 * passed it. The pre-push hook calls it with `--pre-push`, so pushing a tree
 * that `pnpm test:once`, or an earlier push, already tested skips the rerun.
 *
 * A run is reused by content only, never by which files changed: the same git
 * tree, Node version and installed dependencies, on a working tree with no
 * changes and no untracked files. Ignored files are outside the key, since a
 * push never carries them. Whatever it cannot establish, it runs the suite for.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const DELETED = /^0+$/;
// `git ls-files -v` tags: lowercase for assume-unchanged, S for skip-worktree.
// Edits to those files never show in `git status`.
const HIDDEN = /^([a-z]|S) /m;

/** The local shas a push sends, from git's pre-push input; a deletion sends none. */
export function parsePushedShas(input) {
  return input
    .split('\n')
    .map((line) => line.trim().split(/\s+/)[1])
    .filter((sha) => sha && !DELETED.test(sha));
}

/** What a passed run of `state` is recorded as; a tree with changes has none. */
function runId(state) {
  return state?.clean ? `${state.tree} ${state.key}` : null;
}

/** Whether the passed run recorded in `stamp` covers `state` and every pushed tree. */
export function canSkip({ stamp, state, pushedTrees }) {
  return (
    stamp != null &&
    stamp === runId(state) &&
    pushedTrees.every((tree) => tree === state.tree)
  );
}

function git(cwd, ...args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

/** Whether the working tree is clean, its tree, and what else a run depends on. */
function readState(cwd) {
  const installed = readFileSync(resolve(cwd, 'node_modules/.pnpm/lock.yaml'));
  const installHash = createHash('sha256').update(installed).digest('hex');
  const status = git(cwd, 'status', '--porcelain', '--untracked-files=normal');

  return {
    clean: status === '' && !HIDDEN.test(git(cwd, 'ls-files', '-v')),
    tree: git(cwd, 'rev-parse', 'HEAD^{tree}'),
    key: `${process.version} ${installHash}`,
  };
}

/** Per worktree, inside the git directory, so it never shows up as a change. */
function stampPath(cwd) {
  return resolve(cwd, git(cwd, 'rev-parse', '--git-path', 'test-once'));
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

function runSuite(cwd) {
  // A hook in a linked worktree exports GIT_DIR, which would point any git
  // command a test runs elsewhere at this repository.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_')),
  );
  const result = spawnSync('pnpm', ['test'], {
    cwd,
    env,
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  if (result.error) {
    console.error(
      `test-once: could not run pnpm test: ${result.error.message}`,
    );
  }

  return result.status ?? 1;
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
  const stamp = attempt(() => readFileSync(stampPath(cwd), 'utf8'));

  if (before && pushedTrees && canSkip({ stamp, state: before, pushedTrees })) {
    console.log(
      `test-once: the full jsdom suite already passed on tree ${before.tree.slice(0, 8)}; skipping it.`,
    );

    return 0;
  }

  const status = run(cwd);
  // An edit or an install during the run leaves a result for a state no one has.
  const id = status === 0 ? runId(attempt(() => readState(cwd))) : null;

  if (id && id === runId(before)) {
    attempt(() => writeFileSync(stampPath(cwd), id));
  }

  return status;
}

// Node resolves symlinks in import.meta.url, so compare real paths: a mismatch
// would exit 0 without running anything.
if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) ===
    attempt(() => realpathSync(process.argv[1]))
)
  process.exit(main(process.argv.slice(2)));

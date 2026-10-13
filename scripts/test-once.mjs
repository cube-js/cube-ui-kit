#!/usr/bin/env node
/**
 * Runs the full jsdom suite (`pnpm test`) unless this exact tree is the last
 * one that passed it in this worktree. The pre-push hook calls it with
 * `--pre-push`, which also requires every pushed ref to point at that tree;
 * otherwise it runs the suite on the working tree, as `pnpm test` did.
 *
 * A run is reused by content only, never by which files changed: the same git
 * tree, Node version and architecture, installed dependencies and
 * `KEYED_ENV`, on a working tree with no changes and no untracked files, where
 * no tracked file was written while the suite ran. Ignored files are outside
 * the key, since a push never carries them. Whatever it cannot establish, it
 * runs the suite for.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isatty } from 'node:tty';
import { fileURLToPath } from 'node:url';

const root = resolve(import.meta.dirname, '..');
// Environment variables that change what the suite checks.
const KEYED_ENV = ['NODE_OPTIONS', 'TZ', 'UPDATE_DEFAULTS'];
const DELETED = /^0+$/;
// `<local ref> <local sha> <remote ref> <remote sha>`, read from the end: the
// local ref is the source as typed, which can contain spaces.
const PUSH_LINE = / ([0-9a-f]{40,64}) \S+ [0-9a-f]{40,64}$/;
// `git ls-files -v` tags: lowercase for assume-unchanged, S for skip-worktree.
// Edits to those files never show in `git status`.
const HIDDEN = /^([a-z]|S) /m;

/** The local shas a push sends, from git's pre-push input; a deletion sends none. */
export function parsePushedShas(input) {
  return input
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => {
      const sha = PUSH_LINE.exec(line)?.[1];

      if (!sha) throw new Error(`Unexpected pre-push line: ${line}`);

      return sha;
    })
    .filter((sha) => !DELETED.test(sha));
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
    key: JSON.stringify([
      process.version,
      process.arch,
      ...KEYED_ENV.map((name) => process.env[name] ?? null),
      installHash,
    ]),
  };
}

/** What a passed run of `state` is recorded as; a tree with changes has none. */
function runId(state) {
  return state?.clean ? `${state.tree} ${state.key}` : null;
}

/** Whether no tracked file was written since `time`, even with its content restored. */
function untouchedSince(cwd, time) {
  return git(cwd, 'ls-files', '-z')
    .split('\0')
    .filter(Boolean)
    .every((file) => lstatSync(resolve(cwd, file)).mtimeMs < time);
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
  // `process.stdin.isTTY` would open fd 0 as non-blocking, and a read before
  // git has written its lines would then fail.
  return isatty(0) ? '' : readFileSync(0, 'utf8');
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
  const id = runId(before);

  if (
    id &&
    stamp === id &&
    pushedTrees?.every((tree) => tree === before.tree)
  ) {
    console.log(
      `test-once: the full jsdom suite already passed on tree ${before.tree.slice(0, 8)}; skipping it.`,
    );

    return 0;
  }

  const started = Date.now();
  const status = run(cwd);

  // An edit, even a reverted one, or an install during the run leaves a
  // result for a state no one has.
  if (
    status === 0 &&
    id &&
    runId(attempt(() => readState(cwd))) === id &&
    attempt(() => untouchedSince(cwd, started))
  ) {
    attempt(() => writeFileSync(stampPath(cwd), id));
  }

  return status;
}

// Node can keep a symlinked path in either one, and a mismatch would exit 0
// without running anything, so compare real paths.
if (
  attempt(() => realpathSync(process.argv[1])) ===
  realpathSync(fileURLToPath(import.meta.url))
)
  process.exit(main(process.argv.slice(2)));

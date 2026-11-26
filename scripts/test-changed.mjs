#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { kindOf } from './ci/plan-jobs.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const publicApiTest = 'src/public-api.test.ts';

function git(...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' });
}

function defaultBase() {
  for (const ref of ['origin/main', 'main']) {
    if (
      spawnSync('git', ['rev-parse', '--verify', '--quiet', ref], { cwd: root })
        .status === 0
    )
      return ref;
  }
}

function changedFiles(base) {
  const mergeBase = base
    ? git('merge-base', '--', base, 'HEAD').trim()
    : 'HEAD';
  // Both sides of a rename matter. A removed path no longer has an import
  // graph, and `git diff` doesn't include files that have never been staged.
  const tracked = git(
    'diff',
    '--no-renames',
    '--name-only',
    '-z',
    mergeBase,
    '--',
  );
  const untracked = git('ls-files', '--others', '--exclude-standard', '-z');
  return [...new Set(`${tracked}${untracked}`.split('\0').filter(Boolean))];
}

export function vitestArgs(files) {
  const inputs = files.filter((file) => kindOf(file).reads.includes('tests'));
  if (inputs.length === 0) return [];

  // The planner knows which tooling and configuration can affect the suite.
  // It also catches missing inputs whose old imports can no longer be traced.
  if (
    inputs.some(
      (file) => !file.startsWith('src/') || !existsSync(resolve(root, file)),
    )
  ) {
    return ['run'];
  }

  // Vitest follows imports (including setup files and their dependencies).
  // These specs also read source directly, including erased type-only edges.
  const related = new Set(inputs);
  if (inputs.some((file) => kindOf(file).kind === 'full')) {
    related.add(publicApiTest);
    related.add('src/tokens/tasty-config.test.ts');
  }
  if (related.has('src/__snapshots__/public-api.md'))
    related.add(publicApiTest);
  if (inputs.some((file) => /\.(m?[jt]sx?|mdx)$/.test(file))) {
    related.add('scripts/ci/plan-jobs.test.mjs');
  }

  return ['related', '--run', ...related];
}

function main(argv) {
  // Usage: pnpm test:changed [--base <ref>] [-- <vitest options>]
  let base = process.env.GITHUB_BASE_REF
    ? `origin/${process.env.GITHUB_BASE_REF}`
    : undefined;
  const options = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--base') {
      base = argv[++i];
      if (!base || base.startsWith('--'))
        throw new Error('--base requires a Git ref');
    } else if (arg === '--') {
      options.push(...argv.slice(i + 1));
      break;
    } else {
      options.push(arg);
    }
  }

  const files = changedFiles(base ?? defaultBase());
  console.log(`test-changed: ${files.length} changed file(s)`);
  for (const file of files) console.log(`  ${file}`);

  const args = vitestArgs(files);
  if (args.length === 0) {
    console.log('test-changed: no test inputs changed; skipping');
    return 0;
  }
  if (args[0] === 'run') console.log('test-changed: full suite selected');

  const result = spawnSync('pnpm', ['exec', 'vitest', ...args, ...options], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}

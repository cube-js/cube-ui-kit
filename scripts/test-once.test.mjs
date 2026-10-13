import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { main, parsePushedShas } from './test-once.mjs';

const A = 'a'.repeat(40);
const B = 'b'.repeat(40);
const ZERO = '0'.repeat(40);

describe('parsePushedShas', () => {
  it('reads the local sha of every pushed ref', () => {
    expect(
      parsePushedShas(
        `refs/heads/x ${A} refs/heads/x ${ZERO}\nrefs/heads/y ${B} refs/heads/y ${A}\n`,
      ),
    ).toEqual([A, B]);
  });

  it('leaves out a deleted ref, which sends nothing', () => {
    expect(parsePushedShas(`(delete) ${ZERO} refs/heads/x ${A}\n`)).toEqual([]);
  });

  it('reads a local ref typed with spaces from the end of the line', () => {
    expect(
      parsePushedShas(`HEAD^{/x ${B} y} ${A} refs/heads/z ${ZERO}\n`),
    ).toEqual([A]);
  });

  it('rejects a line it cannot read', () => {
    expect(() => parsePushedShas(`refs/heads/x ${A}\n`)).toThrow();
  });
});

describe('main', () => {
  let dir;

  const git = (...args) =>
    execFileSync(
      'git',
      ['-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', ...args],
      { cwd: dir, encoding: 'utf8' },
    ).trim();
  const write = (file, text) => writeFileSync(join(dir, file), text);
  const commit = (file, text) => {
    write(file, text);
    git('add', '-A');
    git('commit', '-q', '-m', file);

    // Older than any run's start, whatever the filesystem clock's granularity.
    const past = new Date(Date.now() - 60_000);

    for (const tracked of git('ls-files', '-z').split('\0').filter(Boolean)) {
      utimesSync(join(dir, tracked), past, past);
    }

    return git('rev-parse', 'HEAD');
  };
  const passing = () => vi.fn(() => 0);

  beforeEach(() => {
    // A git hook in a linked worktree exports GIT_DIR, which would point every
    // git command here at the repository being pushed instead of `dir`.
    for (const name of Object.keys(process.env)) {
      if (name.startsWith('GIT_')) vi.stubEnv(name, undefined);
    }

    dir = mkdtempSync(join(tmpdir(), 'test-once-'));
    git('init', '-q');
    git('config', 'user.email', 'test@example.com');
    git('config', 'user.name', 'Test');
    mkdirSync(join(dir, 'node_modules/.pnpm'), { recursive: true });
    write('node_modules/.pnpm/lock.yaml', 'lockfileVersion: 9');
    write('.gitignore', 'node_modules\n');
    commit('a.txt', 'one');
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    rmSync(dir, { recursive: true, force: true });
    rmSync(`${dir}-link`, { force: true });
  });

  it('runs the suite once for a clean tree, then reuses the pass', () => {
    const run = passing();

    expect(main([], { cwd: dir, run })).toBe(0);
    expect(main([], { cwd: dir, run })).toBe(0);
    expect(run).toHaveBeenCalledTimes(1);
    // The record lives in the git directory, not in the working tree.
    expect(git('status', '--porcelain')).toBe('');
  });

  it('keeps no record of a failed run', () => {
    const run = vi.fn(() => 1);

    expect(main([], { cwd: dir, run })).toBe(1);
    expect(main([], { cwd: dir, run })).toBe(1);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('runs the suite again for a new commit', () => {
    const run = passing();

    main([], { cwd: dir, run });
    commit('a.txt', 'two');
    main([], { cwd: dir, run });

    expect(run).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['a changed file', () => write('a.txt', 'two')],
    ['an untracked file', () => write('b.test.mjs', 'it()')],
    [
      'an untracked file git status is set to hide',
      () => {
        git('config', 'status.showUntrackedFiles', 'no');
        write('b.test.mjs', 'it()');
      },
    ],
    [
      'a changed file marked assume-unchanged',
      () => {
        git('update-index', '--assume-unchanged', 'a.txt');
        write('a.txt', 'two');
      },
    ],
    [
      'a changed file marked skip-worktree',
      () => {
        git('update-index', '--skip-worktree', 'a.txt');
        write('a.txt', 'two');
      },
    ],
  ])('does not reuse a run with %s', (_, change) => {
    const run = passing();

    main([], { cwd: dir, run });
    change();
    main([], { cwd: dir, run });

    expect(run).toHaveBeenCalledTimes(2);
  });

  it.each([
    [
      'a file changes',
      () => write('a.txt', 'edited meanwhile'),
      () => git('checkout', '-q', '--', 'a.txt'),
    ],
    [
      'a file is edited and restored',
      () => {
        write('a.txt', 'edited meanwhile');
        git('checkout', '-q', '--', 'a.txt');
      },
      () => {},
    ],
    [
      'the install changes',
      () => write('node_modules/.pnpm/lock.yaml', 'lockfileVersion: 10'),
      () => write('node_modules/.pnpm/lock.yaml', 'lockfileVersion: 9'),
    ],
  ])('keeps no record when %s while the suite runs', (_, during, after) => {
    const run = vi.fn(() => {
      if (run.mock.calls.length === 1) during();

      return 0;
    });

    main([], { cwd: dir, run });
    after();
    main([], { cwd: dir, run });

    expect(run).toHaveBeenCalledTimes(2);
  });

  it('runs the suite again after the install changes', () => {
    const run = passing();

    main([], { cwd: dir, run });
    write('node_modules/.pnpm/lock.yaml', 'lockfileVersion: 9\nchanged: true');
    main([], { cwd: dir, run });

    expect(run).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['version', 'v0.0.0'],
    ['arch', 'other'],
  ])('runs the suite again under another Node %s', (property, value) => {
    const run = passing();
    const descriptor = Object.getOwnPropertyDescriptor(process, property);

    main([], { cwd: dir, run });

    try {
      Object.defineProperty(process, property, { ...descriptor, value });
      main([], { cwd: dir, run });
    } finally {
      Object.defineProperty(process, property, descriptor);
    }

    expect(run).toHaveBeenCalledTimes(2);
  });

  it.each([
    'CI',
    'LANG',
    'LC_ALL',
    'LC_MESSAGES',
    'NODE_ENV',
    'NODE_OPTIONS',
    'TZ',
    'UPDATE_DEFAULTS',
  ])('runs the suite again when %s changes', (name) => {
    const run = passing();

    main([], { cwd: dir, run });
    vi.stubEnv(name, '1');
    main([], { cwd: dir, run });

    expect(run).toHaveBeenCalledTimes(2);
  });

  describe('from the command line', () => {
    // The fake pnpm fails, so exit status 1 means the suite ran.
    const cli = (args, input) =>
      spawnSync(process.execPath, args, {
        env: { ...process.env, PATH: `${dir}/bin:${process.env.PATH}` },
        input,
      }).status;

    beforeEach(() => {
      mkdirSync(join(dir, 'scripts'));
      mkdirSync(join(dir, 'bin'));
      writeFileSync(join(dir, 'bin/pnpm'), '#!/bin/sh\nexit 1\n', {
        mode: 0o755,
      });
      // A copy, so the script reads this repository, not the real checkout.
      commit(
        'scripts/test-once.mjs',
        readFileSync(join(import.meta.dirname, 'test-once.mjs'), 'utf8'),
      );
    });

    it.each([
      ['through a symlink', []],
      ['with --preserve-symlinks-main', ['--preserve-symlinks-main']],
    ])('runs the suite %s', (_, flags) => {
      symlinkSync(dir, `${dir}-link`);

      expect(cli([...flags, `${dir}-link/scripts/test-once.mjs`])).toBe(1);
    });

    it.each([
      ['skips a pushed ref at the tree that passed', 'HEAD', 0],
      ['runs the suite for a pushed ref at another tree', 'HEAD~1', 1],
    ])('%s, read from stdin', (_, ref, status) => {
      const sha = git('rev-parse', ref);

      main([], { cwd: dir, run: () => 0 });

      expect(
        cli(
          [`${dir}/scripts/test-once.mjs`, '--pre-push'],
          `refs/heads/x ${sha} refs/heads/x ${ZERO}\n`,
        ),
      ).toBe(status);
    });
  });

  describe('before a push', () => {
    it('skips a push of the tree that passed', () => {
      const head = git('rev-parse', 'HEAD');
      const run = passing();

      main([], { cwd: dir, run });
      const input = () =>
        `refs/heads/main ${head} refs/heads/main ${ZERO}\n(delete) ${ZERO} refs/heads/gone ${A}\n`;

      expect(main(['--pre-push'], { cwd: dir, run, input })).toBe(0);
      expect(run).toHaveBeenCalledTimes(1);
    });

    it('runs the suite when any pushed ref has another tree', () => {
      const old = git('rev-parse', 'HEAD');
      const run = passing();
      const head = commit('a.txt', 'two');

      main([], { cwd: dir, run });
      const input = () =>
        `refs/heads/main ${head} refs/heads/main ${ZERO}\nrefs/heads/old ${old} refs/heads/old ${ZERO}\n`;

      main(['--pre-push'], { cwd: dir, run, input });

      expect(run).toHaveBeenCalledTimes(2);
    });

    it('runs the suite when the pushed sha cannot be read', () => {
      const run = passing();

      main([], { cwd: dir, run });
      const input = () => `refs/heads/main ${B} refs/heads/main ${ZERO}\n`;

      main(['--pre-push'], { cwd: dir, run, input });

      expect(run).toHaveBeenCalledTimes(2);
    });
  });
});

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { canSkip, main, parsePushedShas } from './test-once.mjs';

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
});

describe('canSkip', () => {
  const state = { clean: true, tree: 't1', key: 'k1' };
  const stamp = 't1 k1';

  it('reuses a passed run of the same clean tree', () => {
    expect(canSkip({ stamp, state, pushedTrees: [] })).toBe(true);
    expect(canSkip({ stamp, state, pushedTrees: ['t1', 't1'] })).toBe(true);
  });

  it.each([
    ['no run passed yet', { stamp: null, state }],
    [
      'the working tree has changes',
      { stamp, state: { ...state, clean: false } },
    ],
    ['another tree passed', { stamp: 't0 k1', state }],
  ])('runs the suite when %s', (_, input) => {
    expect(canSkip({ ...input, pushedTrees: [] })).toBe(false);
  });

  it('runs the suite when a pushed ref has another tree', () => {
    expect(canSkip({ stamp, state, pushedTrees: ['t1', 't2'] })).toBe(false);
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
  ])('neither reuses nor records a run with %s', (_, change) => {
    const run = passing();

    main([], { cwd: dir, run });
    change();
    main([], { cwd: dir, run });
    main([], { cwd: dir, run });

    expect(run).toHaveBeenCalledTimes(3);
  });

  it('keeps no record when a file changes while the suite runs', () => {
    const run = vi.fn(() => {
      write('a.txt', 'edited meanwhile');

      return 0;
    });

    main([], { cwd: dir, run });
    git('checkout', '-q', '--', 'a.txt');
    main([], { cwd: dir, run });

    expect(run).toHaveBeenCalledTimes(2);
  });

  it('keeps no record when the install changes while the suite runs', () => {
    const run = vi.fn(() => {
      write(
        'node_modules/.pnpm/lock.yaml',
        `lockfileVersion: ${run.mock.calls.length}`,
      );

      return 0;
    });

    main([], { cwd: dir, run });
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

  it('runs the suite again under another Node version', () => {
    const run = passing();
    const version = Object.getOwnPropertyDescriptor(process, 'version');

    main([], { cwd: dir, run });

    try {
      Object.defineProperty(process, 'version', {
        ...version,
        value: 'v0.0.0',
      });
      main([], { cwd: dir, run });
    } finally {
      Object.defineProperty(process, 'version', version);
    }

    expect(run).toHaveBeenCalledTimes(2);
  });

  describe('before a push', () => {
    it('skips a push of the tree that passed', () => {
      const head = git('rev-parse', 'HEAD');
      const run = passing();

      main([], { cwd: dir, run });
      const input = () => `refs/heads/main ${head} refs/heads/main ${ZERO}\n`;

      expect(main(['--pre-push'], { cwd: dir, run, input })).toBe(0);
      expect(run).toHaveBeenCalledTimes(1);
    });

    it('runs the suite for a pushed commit with another tree', () => {
      const old = git('rev-parse', 'HEAD');
      const run = passing();

      commit('a.txt', 'two');
      main([], { cwd: dir, run });
      const input = () => `refs/heads/old ${old} refs/heads/old ${ZERO}\n`;

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

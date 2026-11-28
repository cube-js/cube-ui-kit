import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import {
  finalMoves,
  keepSorted,
  main,
  rewritePaths,
  rewriteSpecifier,
} from './move-files.mjs';

function specifier(file, spec, { moves, files, origin = file }) {
  const existing = new Set(files);

  return rewriteSpecifier({
    file,
    origin,
    specifier: spec,
    moves: new Map(Object.entries(moves)),
    exists: (path) => existing.has(path),
  });
}

describe('rewriteSpecifier', () => {
  it('follows a file renamed in its folder', () => {
    expect(
      specifier('src/a/Button.tsx', './useFoo', {
        moves: { 'src/a/useFoo.ts': 'src/a/use-foo.ts' },
        files: ['src/a/Button.tsx', 'src/a/use-foo.ts'],
      }),
    ).toBe('./use-foo');
  });

  it('follows a case-only rename', () => {
    expect(
      specifier('src/index.ts', './provider', {
        moves: { 'src/provider.tsx': 'src/Provider.tsx' },
        files: ['src/index.ts', 'src/Provider.tsx'],
      }),
    ).toBe('./Provider');
  });

  it('keeps a folder specifier when only its index is renamed', () => {
    expect(
      specifier('src/index.ts', './Picker', {
        moves: { 'src/Picker/index.tsx': 'src/Picker/index.ts' },
        files: ['src/index.ts', 'src/Picker/index.ts'],
      }),
    ).toBeNull();
  });

  it('keeps an extension the specifier spells out', () => {
    expect(
      specifier('scripts/x.mjs', '../src/a/useFoo.ts', {
        moves: { 'src/a/useFoo.ts': 'src/a/use-foo.ts' },
        files: ['scripts/x.mjs', 'src/a/use-foo.ts'],
      }),
    ).toBe('../src/a/use-foo.ts');
  });

  it("rewrites a moved file's specifiers to files that stayed", () => {
    expect(
      specifier('src/Button/Button.tsx', './utils', {
        origin: 'src/actions/Button.tsx',
        moves: { 'src/actions/Button.tsx': 'src/Button/Button.tsx' },
        files: ['src/Button/Button.tsx', 'src/actions/utils.ts'],
      }),
    ).toBe('../actions/utils');
  });

  it('keeps a query after the path', () => {
    expect(
      specifier('src/a/A.docs.mdx', './guideNotes.md?raw', {
        moves: { 'src/a/guideNotes.md': 'src/a/guide-notes.md' },
        files: ['src/a/A.docs.mdx', 'src/a/guide-notes.md'],
      }),
    ).toBe('./guide-notes.md?raw');
  });

  it('leaves a specifier that still resolves alone', () => {
    expect(
      specifier('src/a/Button.tsx', './Icon', {
        moves: { 'src/a/useFoo.ts': 'src/a/use-foo.ts' },
        files: ['src/a/Button.tsx', 'src/a/Icon.tsx'],
      }),
    ).toBeNull();
  });
});

describe('finalMoves', () => {
  it('follows a later entry that moves a file again', () => {
    expect(
      finalMoves([
        ['src/a/useFoo.ts', 'src/a/use-foo.ts'],
        ['src/a/use-foo.ts', 'src/hooks/use-foo.ts'],
      ]).get('src/a/useFoo.ts'),
    ).toBe('src/hooks/use-foo.ts');
  });
});

describe('rewritePaths', () => {
  const moves = new Map([
    ['src/a/useFoo.ts', 'src/a/use-foo.ts'],
    ['src/provider.tsx', 'src/Provider.tsx'],
  ]);

  it('rewrites a path with or without its extension', () => {
    expect(rewritePaths('See `src/a/useFoo.ts` and src/a/useFoo.', moves)).toBe(
      'See `src/a/use-foo.ts` and src/a/use-foo.',
    );
  });

  it('leaves a longer name that starts with the same path', () => {
    const text = 'src/a/useFoo.test.ts, src/providers/x.ts, ./src/a/useFooBar';

    expect(rewritePaths(text, moves)).toBe(text);
  });

  it('rewrites a path after a slash, as in a URL or ./src', () => {
    expect(
      rewritePaths('blob/main/src/provider.tsx ./src/a/useFoo.ts', moves),
    ).toBe('blob/main/src/Provider.tsx ./src/a/use-foo.ts');
  });
});

describe('keepSorted', () => {
  it('sorts renamed keys again in the order they were sorted', () => {
    const previous = { 'src/a/useFoo.ts': 1, 'src/a/useZ.ts': 2 };
    const next = { 'src/a/zzz.ts': 1, 'src/a/useZ.ts': 2 };

    expect(Object.keys(keepSorted(previous, next))).toEqual([
      'src/a/useZ.ts',
      'src/a/zzz.ts',
    ]);
  });

  it('keeps code-unit order, uppercase first', () => {
    const previous = { 'src/B.tsx': 1, 'src/a.ts': 2 };
    const next = { 'src/b.tsx': 1, 'src/a.ts': 2 };

    expect(Object.keys(keepSorted(previous, next))).toEqual([
      'src/a.ts',
      'src/b.tsx',
    ]);
  });

  it('leaves an unsorted object as it was', () => {
    expect(keepSorted({ b: 1, a: 2 }, { c: 1, a: 2 })).toBeNull();
  });
});

describe('main', () => {
  let dir;
  const git = (...args) =>
    execFileSync('git', args, { cwd: dir, encoding: 'utf8' });
  const write = (file, text) => {
    mkdirSync(dirname(join(dir, file)), { recursive: true });
    writeFileSync(join(dir, file), text);
  };
  const read = (file) => readFileSync(join(dir, file), 'utf8');

  beforeEach(() => {
    // A git hook exports GIT_DIR and GIT_INDEX_FILE, which would point every
    // git command here at the repository being committed instead of `dir`.
    for (const name of Object.keys(process.env)) {
      if (name.startsWith('GIT_')) vi.stubEnv(name, undefined);
    }

    dir = mkdtempSync(join(tmpdir(), 'move-files-'));
    git('init', '-q');
    git('config', 'user.email', 'test@example.com');
    git('config', 'user.name', 'Test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(dir, { recursive: true, force: true });
  });

  it.each([
    ['in order', ['src/a/useFoo.ts', 'src/a/use-foo.ts']],
    ['in reverse', ['src/a/use-foo.ts', 'src/a/useFoo.ts']],
  ])(
    'moves a file along a chain of entries %s, with git, once',
    async (_, order) => {
      const chain = {
        'src/a/useFoo.ts': 'src/a/use-foo.ts',
        'src/a/use-foo.ts': 'src/hooks/use-foo.ts',
      };

      write('src/a/useFoo.ts', 'export const useFoo = 1;\n');
      write('src/a/Button.tsx', "import { useFoo } from './useFoo';\n");
      write(
        'src/a/notes.md',
        'See [the hook](useFoo.ts).\n\n```md\n[example](./missing.ts)\n```\n',
      );
      write('docs/notes.md', 'See `src/a/useFoo.ts`.\n');
      write(
        'scripts/move-files.json',
        JSON.stringify(
          Object.fromEntries(order.map((from) => [from, chain[from]])),
        ),
      );
      git('add', '-A');
      git('commit', '-q', '-m', 'start');

      const log = vi.fn();

      expect(await main({ root: dir, dryRun: true, log })).toMatchObject({
        moved: 1,
        rewritten: 3,
        leftovers: [],
      });
      expect(await main({ root: dir, log })).toMatchObject({
        moved: 1,
        rewritten: 3,
        unresolved: [],
      });
      expect(git('status', '--porcelain').split('\n').sort()).toEqual([
        '',
        ' M docs/notes.md',
        ' M src/a/Button.tsx',
        ' M src/a/notes.md',
        'R  src/a/useFoo.ts -> src/hooks/use-foo.ts',
      ]);
      expect(read('src/a/Button.tsx')).toContain("from '../hooks/use-foo'");
      expect(read('src/a/notes.md')).toBe(
        'See [the hook](../hooks/use-foo.ts).\n\n```md\n[example](./missing.ts)\n```\n',
      );
      expect(read('docs/notes.md')).toBe('See `src/hooks/use-foo.ts`.\n');
      expect(await main({ root: dir, log })).toMatchObject({
        moved: 0,
        rewritten: 0,
      });
    },
  );
});

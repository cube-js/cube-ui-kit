// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

import { inputHash, JOBS, kindOf, markerKey, plan } from './plan-jobs.mjs';

const SCRIPT = fileURLToPath(new URL('./plan-jobs.mjs', import.meta.url));
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const jobs = Object.keys(JOBS);
const running = (decisions) =>
  Object.keys(decisions).filter((job) => decisions[job].run);

describe('kindOf', () => {
  it.each([
    ['.changeset/brave-owls.md', 'repo-notes'],
    ['.claude/skills/ui-review/SKILL.md', 'repo-notes'],
    ['docs/rules/coding.md', 'repo-notes'],
    ['src/components/form/Form/modern-form-guide.md', 'docs-guide'],
    ['README.md', 'package-readme'],
    ['AGENTS.md', 'notes'],
    ['harness/plugin.json', 'harness'],
    ['harness/dev.harnesspm/patches/glaze-colors.patch.md', 'harness'],
    ['src/components/fields/README.md', 'notes'],
    ['src/components/form/Form/form-types.test-d.tsx', 'type-fixture'],
    ['src/components/overlays/Dialog/Dialog.browser.test.tsx', 'browser-spec'],
    ['src/components/overlays/Dialog/DialogTrigger.test.tsx', 'spec'],
    ['src/tokens/tasty-config.test.ts', 'spec'],
    ['src/components/Foo/__snapshots__/Foo.test.tsx.snap', 'spec'],
    ['src/test/setup.ts', 'full'],
    ['src/components/form/Form/modern/field.fixture.tsx', 'fixture'],
    ['src/components/actions/Button/Button.docs.mdx', 'docs-page'],
    ['src/stories/Usage.docs.mdx', 'docs-page'],
    ['src/components/actions/Button/Button.stories.tsx', 'story'],
    ['src/stories/chromatic.ts', 'story'],
    ['.size-limit.cjs', 'size-config'],
    ['scripts/bundle-deps-baseline.json', 'size-baseline'],
    ['scripts/a11y-baseline.json', 'a11y-baseline'],
    ['src/components/actions/Button/Button.tsx', 'full'],
    ['src/probe/index.ts', 'full'],
    ['scripts/compiler/baseline.json', 'full'],
    ['scripts/ci/plan-jobs.mjs', 'full'],
    ['.github/workflows/pull-request.yml', 'full'],
    ['.storybook/preview.jsx', 'full'],
    ['package.json', 'full'],
    ['pnpm-lock.yaml', 'full'],
    ['some/unforeseen/path.txt', 'full'],
  ])('%s is %s', (path, kind) => {
    expect(kindOf(path).kind).toBe(kind);
  });
});

describe('plan by the PR’s files', () => {
  const runs = (files) => running(plan({ jobs, files }));

  it('runs nothing for repository notes and changesets', () => {
    expect(runs(['.changeset/a.md', 'AGENTS.md', 'docs/rules/ci.md'])).toEqual(
      [],
    );
  });

  it('runs only the jsdom suites for a spec', () => {
    expect(
      runs(['src/components/overlays/Dialog/DialogTrigger.test.tsx']),
    ).toEqual(['tests', 'compiled-tests', 'form-react']);
  });

  it('runs only the browser suite for a browser spec', () => {
    expect(
      runs(['src/components/layout/Board/Board.browser.test.tsx']),
    ).toEqual(['browser-tests']);
  });

  it('runs Storybook checks and the canary for a story', () => {
    expect(runs(['src/components/form/Form/Form.stories.tsx'])).toEqual([
      'a11y',
      'chromatic',
      'canary',
    ]);
  });

  it('keeps Chromatic for a docs page, for its preview', () => {
    expect(runs(['src/components/layout/Board/Board.docs.mdx'])).toEqual([
      'chromatic',
      'canary',
    ]);
  });

  it('runs every job for runtime source or an unknown file', () => {
    expect(runs(['src/components/actions/Button/Button.tsx'])).toEqual(jobs);
    expect(runs(['unforeseen.txt'])).toEqual(jobs);
  });

  it('runs every job when the files are unknown', () => {
    const decisions = plan({ jobs, files: null });
    expect(running(decisions)).toEqual(jobs);
    expect(decisions.tests.reason).toBe('unknown');
  });

  it('runs the union of what mixed files need', () => {
    expect(
      runs([
        'src/components/form/Form/modern/field.fixture.tsx',
        'src/components/actions/Button/Button.stories.tsx',
      ]),
    ).toEqual([
      'tests',
      'compiled-tests',
      'form-react',
      'browser-tests',
      'a11y',
      'chromatic',
      'canary',
    ]);
  });
});

describe('plan by pass markers', () => {
  const tree = [
    '100644 blob aaaa\tsrc/components/actions/Button/Button.tsx',
    '100644 blob bbbb\tsrc/components/actions/Button/Button.test.tsx',
    '100644 blob cccc\tsrc/components/actions/Button/Button.stories.tsx',
    '100644 blob dddd\tAGENTS.md',
  ];
  const edit = (path, blob) =>
    tree.map((line) =>
      line.endsWith(`\t${path}`)
        ? line.replace(/blob \w+/, `blob ${blob}`)
        : line,
    );
  const passed = (job, onTree) =>
    markerKey(job, inputHash(onTree, JOBS[job].reads));

  it('hashes only the files a group reads', () => {
    expect(inputHash(edit('AGENTS.md', 'eeee'), 'tests')).toBe(
      inputHash(tree, 'tests'),
    );
    const story = 'src/components/actions/Button/Button.stories.tsx';
    expect(inputHash(edit(story, 'eeee'), 'tests')).toBe(
      inputHash(tree, 'tests'),
    );
    expect(inputHash(edit(story, 'eeee'), 'a11y')).not.toBe(
      inputHash(tree, 'a11y'),
    );
    const source = 'src/components/actions/Button/Button.tsx';
    expect(inputHash(edit(source, 'eeee'), 'tests')).not.toBe(
      inputHash(tree, 'tests'),
    );
  });

  it('skips a job that passed on identical inputs', () => {
    const markers = new Set([passed('tests', tree)]);
    const files = ['src/components/actions/Button/Button.tsx'];
    const decisions = plan({ jobs, files, tree, markers });
    expect(decisions.tests).toEqual({
      run: false,
      reason: 'passed',
      marker: passed('tests', tree),
    });
    expect(decisions['compiled-tests'].run).toBe(true);
  });

  it('runs it again once one of its inputs changes', () => {
    const markers = new Set([passed('tests', tree)]);
    const changed = edit(
      'src/components/actions/Button/Button.test.tsx',
      'ffff',
    );
    const decisions = plan({ jobs, files: ['x.ts'], tree: changed, markers });
    expect(decisions.tests.run).toBe(true);
    expect(decisions.tests.marker).toBe(passed('tests', changed));
  });

  it('never skips Chromatic, the size check or the canary by marker', () => {
    const decisions = plan({ jobs, files: ['x.ts'], tree, markers: new Set() });
    for (const job of ['chromatic', 'size', 'canary'])
      expect(decisions[job]).toEqual({
        run: true,
        reason: 'affected',
        marker: '',
      });
  });

  it('leaves the marker empty when markers are off', () => {
    expect(plan({ jobs: ['tests'], files: ['x.ts'] }).tests.marker).toBe('');
  });
});

/**
 * The routing table is only sound if no file of a narrow kind is read through
 * an import by a job its kind does not name. So for every relative import in
 * `src`, the imported file's kind must be read by every group that reads the
 * importer. A spec importing a story, or runtime source importing a test
 * helper, fails here, naming the table entry to revisit.
 */
it('routes every import in src to the jobs of its importers', () => {
  const tracked = new Set(
    execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
      .split('\n')
      .filter(Boolean),
  );
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'];
  const resolve = (from, specifier) => {
    const base = posix.join(
      posix.dirname(from),
      specifier.replace(/\?.*$/, ''),
    );
    for (const candidate of [
      ...extensions.map((ext) => base + ext),
      ...extensions.slice(1).map((ext) => `${base}/index${ext}`),
    ])
      if (tracked.has(candidate)) return candidate;
    return null;
  };
  const imports =
    /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*|\bvi\.mock\s*\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g;

  const violations = [];
  for (const file of tracked) {
    if (!/^src\/.*\.(m?[jt]sx?|mdx)$/.test(file) || file.endsWith('.d.ts'))
      continue;
    const reads = kindOf(file).reads;
    for (const [, specifier] of readFileSync(join(ROOT, file), 'utf8').matchAll(
      imports,
    )) {
      const target = resolve(file, specifier);
      if (!target) continue;
      const missing = reads.filter(
        (group) => !kindOf(target).reads.includes(group),
      );
      if (missing.length)
        violations.push(
          `${file} (${kindOf(file).kind}) imports ${target} (${kindOf(target).kind}), which ${missing.join(', ')} would not rerun for`,
        );
    }
  }
  expect(violations).toEqual([]);
});

describe('the command', () => {
  let dir;
  const git = (...args) =>
    execFileSync(
      'git',
      ['-c', 'user.name=ci', '-c', 'user.email=ci@example.com', ...args],
      { cwd: dir, encoding: 'utf8' },
    );
  const write = (path, text) => {
    execFileSync('mkdir', ['-p', dirname(join(dir, path))]);
    writeFileSync(join(dir, path), text);
  };
  const run = (env, ...jobArgs) => {
    const output = join(dir, '.output');
    writeFileSync(output, '');
    execFileSync('node', [SCRIPT, ...jobArgs], {
      cwd: dir,
      stdio: 'pipe',
      env: {
        ...process.env,
        GITHUB_OUTPUT: output,
        GITHUB_STEP_SUMMARY: '',
        ...env,
      },
    });
    return Object.fromEntries(
      readFileSync(output, 'utf8')
        .trim()
        .split('\n')
        .map((line) => line.split('=')),
    );
  };

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'plan-jobs-'));
    git('init', '-q', '-b', 'main');
    write('src/Button.tsx', 'export const Button = 1;\n');
    write('src/Button.test.tsx', 'it("works", () => {});\n');
    git('add', '.');
    git('commit', '-qm', 'base');
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  /** Commit `change` on a branch and merge it the way GitHub's merge ref does. */
  const pullRequest = (change) => {
    git('checkout', '-qb', 'feature');
    change();
    git('add', '-A');
    git('commit', '-qm', 'change');
    git('checkout', '-q', 'main');
    git('merge', '-q', '--no-ff', '-m', 'merge', 'feature');
    const event = join(dir, '.event.json');
    // A fork's PR: no markers, so the command never calls the API.
    writeFileSync(
      event,
      JSON.stringify({
        pull_request: { number: 1, head: { repo: { full_name: 'fork/repo' } } },
      }),
    );
    return {
      GITHUB_EVENT_NAME: 'pull_request',
      GITHUB_EVENT_PATH: event,
      GITHUB_REPOSITORY: 'cube-js/cube-ui-kit',
    };
  };

  it('runs every job outside a pull request', () => {
    expect(run({ GITHUB_EVENT_NAME: 'push' }, 'size', 'tests')).toEqual({
      size: 'true',
      tests: 'true',
      'marker-tests': '',
    });
  });

  it('plans a pull request from its merge commit', () => {
    const env = pullRequest(() =>
      write('src/Button.test.tsx', 'it("still works", () => {});\n'),
    );
    expect(run(env, 'tests', 'chromatic')).toEqual({
      tests: 'true',
      'marker-tests': '',
      chromatic: 'false',
    });
  });

  it('counts the old path of a rename', () => {
    const env = pullRequest(() =>
      git('mv', 'src/Button.tsx', 'src/Button.stories.tsx'),
    );
    expect(run(env, 'tests').tests).toBe('true');
  });

  it('rejects an unknown job', () => {
    expect(() => run({}, 'nope')).toThrow();
  });
});

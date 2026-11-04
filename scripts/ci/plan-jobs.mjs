/**
 * Decides which CI jobs a pull request run needs, and says why in the run's
 * summary. It answers two questions for each job.
 *
 * 1. Can this PR affect the job at all? The PR's files are the difference
 *    between the merge commit CI checks out and its first parent, the base
 *    branch tip: exactly what merging would change. Each file has a kind (see
 *    `KINDS`), and each kind names the job groups that read it. A file no kind
 *    matches is `full` and runs everything, so an unforeseen path costs time,
 *    never coverage.
 *
 * 2. Has the job already passed on exactly these inputs? A job's inputs are
 *    every tracked file of a kind it reads, hashed by blob id. When a job goes
 *    green, the `Tests & lint` aggregator saves an empty cache entry named
 *    after that hash: a pass marker. A later push to the same PR that leaves
 *    the hash alone (one that only edits a story, say) finds the marker and
 *    skips the job. A merge from `main` or a runtime edit changes the hash, so
 *    the job runs again. Markers are only written and read by this
 *    repository's own PRs, and a "Re-run all jobs" attempt ignores them.
 *
 * Chromatic is never skipped by a marker. Its skip marks the commit as
 * passing, which would approve visual changes an earlier push left unreviewed.
 *
 * Usage: node scripts/ci/plan-jobs.mjs <job>...
 *
 * Writes `<job>=true|false` for each job, plus `marker-<job>=<cache key>` for
 * jobs that use markers (empty when markers are off), to `$GITHUB_OUTPUT`.
 * Anything that is not a pull request runs every job.
 *
 * The plan jobs run it on the runner's own Node, without `setup-node` or an
 * install, so it uses no dependency and nothing newer than Node 20.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Every job group a file can be read by. */
const ALL = ['tests', 'browser', 'a11y', 'chromatic', 'bundle', 'canary'];

/**
 * File kinds, first match wins. `reads` lists the job groups whose result the
 * file can change. `Lint, types & diagnostics` reads every file and always
 * runs, so it is never listed.
 *
 * `plan-jobs.test.mjs` checks every relative import in `src` against this
 * table: the imported file's kind must be read by every group that reads the
 * importer. Add a kind only for a path no job reads beyond what it says.
 */
export const KINDS = [
  {
    kind: 'repo-notes',
    reads: [],
    test: /^(\.changeset|\.husky|\.claude|\.cursor|\.agents|docs\/rules)\//,
  },
  // Shipped in the package, and `ModernForm.docs.mdx` imports one.
  {
    kind: 'docs-guide',
    reads: ['chromatic', 'canary'],
    test: /^docs\/[^/]+\.md$/,
  },
  // `tsdown` copies both into `dist/`.
  {
    kind: 'package-readme',
    reads: ['canary'],
    test: /^(README|CHANGELOG)\.md$/,
  },
  { kind: 'notes', reads: [], test: /\.md$/ },
  // Read only by `pnpm test:types`, in `Lint, types & diagnostics`.
  { kind: 'type-fixture', reads: [], test: /^src\/.*\.test-d\.tsx?$/ },
  {
    kind: 'browser-spec',
    reads: ['browser'],
    test: /^src\/.*\.browser\.test\.tsx?$/,
  },
  {
    kind: 'spec',
    reads: ['tests'],
    test: /^src\/.*(\.test\.tsx?|\/__snapshots__\/.+)$/,
  },
  // `src/test/` is not narrow: the defaults-registry tooling in
  // `src/eslint-plugin/` imports it.
  {
    kind: 'fixture',
    reads: ['tests', 'browser'],
    test: /^src\/.*\.fixture\.tsx?$/,
  },
  // `prepare-docs.mjs` ships each page as `docs/components/**/*.md`.
  {
    kind: 'docs-page',
    reads: ['chromatic', 'canary'],
    test: /^src\/.*\.docs\.mdx$/,
  },
  // The shipped docs take each page's title from its stories file.
  {
    kind: 'story',
    reads: ['a11y', 'chromatic', 'canary'],
    test: /^src\/(.*\.stories\.[jt]sx?|stories\/.+)$/,
  },
  {
    kind: 'size-config',
    reads: ['bundle'],
    test: /^(\.size-limit\.cjs|\.github\/workflows\/size-limit\.yml)$/,
  },
  // `bundle-deps.test.mjs` imports it too.
  {
    kind: 'size-baseline',
    reads: ['bundle', 'tests'],
    test: /^scripts\/bundle-deps-baseline\.json$/,
  },
  {
    kind: 'a11y-baseline',
    reads: ['a11y'],
    test: /^scripts\/a11y-baseline\.json$/,
  },
];

const FULL = { kind: 'full', reads: ALL };

/**
 * The jobs this script plans, by the name each workflow asks for. `reads` is
 * the job group whose files the job reads; `marker` lets a pass marker skip it.
 */
export const JOBS = {
  tests: { reads: 'tests', marker: true },
  'compiled-tests': { reads: 'tests', marker: true },
  'form-react': { reads: 'tests', marker: true },
  'browser-tests': { reads: 'browser', marker: true },
  a11y: { reads: 'a11y', marker: true },
  chromatic: { reads: 'chromatic', marker: false },
  size: { reads: 'bundle', marker: false },
  canary: { reads: 'canary', marker: false },
};

/** Bump to invalidate every pass marker at once. */
const MARKER_PREFIX = 'ci-pass-v1-';

export const kindOf = (path) =>
  KINDS.find(({ test }) => test.test(path)) ?? FULL;

/**
 * Hash of every tracked file a job group reads, from `git ls-tree -r` lines
 * (`<mode> <type> <blob>\t<path>`), so it changes exactly when one of them does.
 */
export function inputHash(tree, group) {
  const hash = createHash('sha256');
  for (const line of tree) {
    const path = line.slice(line.indexOf('\t') + 1);
    if (kindOf(path).reads.includes(group)) hash.update(`${line}\n`);
  }
  return hash.digest('hex').slice(0, 40);
}

export const markerKey = (job, hash) => `${MARKER_PREFIX}${job}-${hash}`;

/**
 * Decide each job.
 *
 * - `files`: the PR's changed files, or `null` when unknown (every job runs).
 * - `tree`: `git ls-tree -r HEAD` lines, or `null` when markers are off.
 * - `markers`: the marker keys that exist, or `null` to not look them up.
 *
 * Returns `{ [job]: { run, reason, marker } }`, where `reason` is one of
 * `affected`, `unaffected`, `passed` or `unknown`.
 */
export function plan({ jobs, files, tree = null, markers = null }) {
  const affected = files && new Set(files.flatMap((f) => kindOf(f).reads));
  return Object.fromEntries(
    jobs.map((job) => {
      const { reads, marker: usesMarker } = JOBS[job];
      if (affected && !affected.has(reads))
        return [job, { run: false, reason: 'unaffected', marker: '' }];
      const marker =
        usesMarker && tree ? markerKey(job, inputHash(tree, reads)) : '';
      if (marker && markers?.has(marker))
        return [job, { run: false, reason: 'passed', marker }];
      return [
        job,
        { run: true, reason: affected ? 'affected' : 'unknown', marker },
      ];
    }),
  );
}

const REASONS = {
  affected: 'This PR changes files it reads.',
  unaffected: 'This PR changes no file it reads.',
  passed:
    'It already passed on these exact inputs in an earlier run of this PR.',
  unknown: 'The PR’s changes are unknown here, so it runs.',
};

function git(...args) {
  return execFileSync('git', ['-c', 'core.quotePath=false', ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
    .split('\n')
    .filter(Boolean);
}

/**
 * The files the PR changes, or `null` when `HEAD` is not the two-parent merge
 * commit `actions/checkout` makes for a pull request (it needs `fetch-depth: 2`).
 */
function changedFiles() {
  const [, ...parents] = git(
    'rev-list',
    '--parents',
    '-n',
    '1',
    'HEAD',
  )[0].split(' ');
  if (parents.length !== 2) return null;
  // `--no-renames` lists both sides of a rename, so moving runtime code into
  // a story still counts the runtime path.
  return git('diff', '--no-renames', '--name-only', 'HEAD^1', 'HEAD');
}

/** Every pass-marker key saved for this pull request's merge ref. */
async function existingMarkers({ api, repository, token, ref }) {
  const keys = new Set();
  for (let page = 1; page <= 10; page++) {
    const query = new URLSearchParams({
      ref,
      key: MARKER_PREFIX,
      per_page: '100',
      page: String(page),
    });
    const response = await fetch(
      `${api}/repos/${repository}/actions/caches?${query}`,
      {
        headers: {
          accept: 'application/vnd.github+json',
          authorization: `Bearer ${token}`,
          'x-github-api-version': '2022-11-28',
        },
      },
    );
    if (!response.ok)
      throw new Error(`${response.status} ${response.statusText}`);
    const { actions_caches: caches } = await response.json();
    for (const { key } of caches) keys.add(key);
    if (caches.length < 100) break;
  }
  return keys;
}

function summary(decisions, files) {
  const rows = Object.entries(decisions).map(
    ([job, { run, reason }]) =>
      `| \`${job}\` | ${run ? '✅ runs' : '⏭️ skipped'} | ${REASONS[reason]} |`,
  );
  const lines = [
    '### 🧭 Job plan',
    '',
    '| Job | Decision | Why |',
    '|---|---|---|',
    ...rows,
  ];
  if (files) {
    const byKind = new Map();
    for (const file of files) {
      const { kind } = kindOf(file);
      byKind.set(kind, [...(byKind.get(kind) ?? []), file]);
    }
    lines.push(
      '',
      `<details><summary>${files.length} changed files</summary>`,
      '',
    );
    for (const [kind, list] of byKind)
      lines.push(
        `- **${kind}**: ${list
          .slice(0, 50)
          .map((f) => `\`${f}\``)
          .join(', ')}${list.length > 50 ? ', …' : ''}`,
      );
    lines.push('', '</details>');
  }
  return `${lines.join('\n')}\n`;
}

async function main(jobs) {
  const unknown = jobs.filter((job) => !Object.hasOwn(JOBS, job));
  if (!jobs.length || unknown.length)
    throw new Error(
      `Usage: plan-jobs.mjs <job>... where a job is one of: ${Object.keys(JOBS).join(', ')}` +
        (unknown.length ? ` (unknown: ${unknown.join(', ')})` : ''),
    );

  const env = process.env;
  const event = env.GITHUB_EVENT_PATH
    ? JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, 'utf8'))
    : {};
  const pr =
    env.GITHUB_EVENT_NAME === 'pull_request' ? event.pull_request : null;
  const files = pr ? changedFiles() : null;

  // A fork's PR runs code its author controls, so it neither saves markers
  // nor trusts them. A "Re-run all jobs" attempt reruns everything it needs.
  const trusted =
    Boolean(pr) && pr.head?.repo?.full_name === env.GITHUB_REPOSITORY;
  const usesMarkers = trusted && jobs.some((job) => JOBS[job].marker);
  const tree = usesMarkers ? git('ls-tree', '-r', 'HEAD') : null;
  let markers = null;
  if (usesMarkers && env.GITHUB_RUN_ATTEMPT === '1') {
    markers = await existingMarkers({
      api: env.GITHUB_API_URL ?? 'https://api.github.com',
      repository: env.GITHUB_REPOSITORY,
      token: env.GITHUB_TOKEN,
      ref: `refs/pull/${pr.number}/merge`,
    }).catch((error) => {
      console.log(
        `::warning::Could not list pass markers (${error.message}); running every affected job.`,
      );
      return null;
    });
  }

  const decisions = plan({ jobs, files, tree, markers });
  const outputs = Object.entries(decisions).flatMap(
    ([job, { run, marker }]) => [
      `${job}=${run}`,
      ...(JOBS[job].marker ? [`marker-${job}=${marker}`] : []),
    ],
  );
  const text = summary(decisions, files);
  console.log(text);
  if (env.GITHUB_OUTPUT)
    appendFileSync(env.GITHUB_OUTPUT, `${outputs.join('\n')}\n`);
  else console.log(outputs.join('\n'));
  if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, text);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

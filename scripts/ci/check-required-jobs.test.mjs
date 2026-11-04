// @vitest-environment node
import { createRequire } from 'node:module';

const { checkRequiredJobs } = createRequire(import.meta.url)(
  './check-required-jobs.cjs',
);
const jobs = [
  'tests',
  'static-checks',
  'form-react',
  'compiled-tests',
  'browser-tests',
  'a11y',
];
const results = (result) =>
  Object.fromEntries(jobs.map((job) => [job, { result }]));

it('accepts a fully green ordinary PR', () => {
  expect(() =>
    checkRequiredJobs(results('success'), 'codex/react-19-only'),
  ).not.toThrow();
});

it.each(['failure', 'cancelled', 'skipped', undefined])(
  'rejects %s from any required job',
  (result) => {
    for (const job of jobs)
      expect(() =>
        checkRequiredJobs(
          { ...results('success'), [job]: { result } },
          'feature',
        ),
      ).toThrow(job);
  },
);

it('permits only the explicit release-PR skip policy', () => {
  expect(() =>
    checkRequiredJobs(results('skipped'), 'changeset-release/main'),
  ).not.toThrow();
  expect(() =>
    checkRequiredJobs(results('failure'), 'changeset-release/main'),
  ).toThrow();
  expect(() => checkRequiredJobs({}, 'feature')).toThrow('missing');
});

describe('the job plan', () => {
  const planned = (result, outputs) => ({
    ...results('success'),
    plan: { result, outputs },
    tests: { result: 'skipped' },
  });

  it('accepts a skip the plan made', () => {
    expect(() =>
      checkRequiredJobs(planned('success', { tests: 'false' }), 'feature'),
    ).not.toThrow();
  });

  it('accepts a job the plan let off that ran and passed', () => {
    expect(() =>
      checkRequiredJobs(
        {
          ...results('success'),
          plan: { result: 'success', outputs: { tests: 'false' } },
        },
        'feature',
      ),
    ).not.toThrow();
  });

  it('still rejects a failure in a job the plan let off', () => {
    expect(() =>
      checkRequiredJobs(
        {
          ...planned('success', { tests: 'false' }),
          tests: { result: 'failure' },
        },
        'feature',
      ),
    ).toThrow('tests');
  });

  it.each([
    ['said the job runs', 'success', { tests: 'true' }],
    ['gave no answer for the job', 'success', {}],
    ['failed', 'failure', { tests: 'false' }],
  ])('rejects a skip when the plan %s', (_, result, outputs) => {
    expect(() =>
      checkRequiredJobs(planned(result, outputs), 'feature'),
    ).toThrow('tests: expected success, got skipped');
  });
});

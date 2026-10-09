// @vitest-environment node
import { createRequire } from 'node:module';

const { checkRequiredJobs } = createRequire(import.meta.url)(
  './check-required-jobs.cjs',
);
const jobs = ['tests', 'form-react', 'compiled-tests', 'browser-tests'];
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

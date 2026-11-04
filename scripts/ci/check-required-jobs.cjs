/**
 * The `Tests & lint` gate in `pull-request.yml`. Every required job must
 * pass, with two exceptions:
 *
 * - The Version Packages PR skips every job (see the workflow's header).
 * - A job may skip when the plan (`scripts/ci/plan-jobs.mjs`) said this run
 *   does not need it. Only an explicit `false` from a plan that succeeded
 *   counts: when the planner fails, every job runs and must pass. A job the
 *   plan let off may still run, and then it must pass like any other.
 */
const required = [
  'tests',
  'static-checks',
  'form-react',
  'compiled-tests',
  'browser-tests',
  'a11y',
];

function allowedResults(results, job, branch) {
  if (branch === 'changeset-release/main') return ['skipped'];
  const plan = results.plan;
  return plan?.result === 'success' && plan.outputs?.[job] === 'false'
    ? ['success', 'skipped']
    : ['success'];
}

function checkRequiredJobs(results, branch) {
  for (const job of required) {
    const allowed = allowedResults(results, job, branch);
    const result = results[job]?.result;
    if (!allowed.includes(result)) {
      throw new Error(
        `${job}: expected ${allowed.join(' or ')}, got ${result ?? 'missing'}`,
      );
    }
  }
}

module.exports = { checkRequiredJobs };

if (require.main === module) {
  checkRequiredJobs(
    JSON.parse(process.env.REQUIRED_JOB_RESULTS),
    process.env.PR_BRANCH,
  );
  console.log('Every required test job satisfied the PR policy.');
}

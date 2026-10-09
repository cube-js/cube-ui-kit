const required = ['tests', 'form-react', 'compiled-tests', 'browser-tests'];

function checkRequiredJobs(results, branch) {
  const expected = branch === 'changeset-release/main' ? 'skipped' : 'success';
  for (const job of required) {
    if (results[job]?.result !== expected) {
      throw new Error(
        `${job}: expected ${expected}, got ${results[job]?.result ?? 'missing'}`,
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

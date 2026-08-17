import { info, setFailed, setOutput, warning } from '@actions/core';
import { getOctokit } from '@actions/github';

/**
 * Resolves the workflow run whose `size-limit-report` artifact should be used
 * as the size baseline for the current pull request.
 *
 * Listing workflow runs by branch cannot be trusted for this: the endpoint
 * neither guarantees ordering nor consistently returns the newest runs at all.
 * It intermittently replies with a stale window that starts weeks in the past,
 * which is how PRs ended up compared against a run from another month and
 * reported double-digit size jumps that never happened.
 *
 * So we walk the base branch's commits instead — reverse-chronological order is
 * inherent to a commit log — and ask for each commit's runs by exact `head_sha`.
 * The first commit with a successful run that still has the artifact wins.
 */

/** How far back along the base branch we are willing to look. */
const MAX_COMMITS = 30;
const PER_PAGE = 100;

async function run() {
  const token = process.env.GITHUB_TOKEN;
  const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? '').split('/');
  const branch = process.env.BASELINE_BRANCH;
  const workflowId = process.env.BASELINE_WORKFLOW;
  const artifactName = process.env.BASELINE_ARTIFACT;
  const currentRunId = Number(process.env.GITHUB_RUN_ID);

  if (!token || !owner || !repo || !branch || !workflowId || !artifactName) {
    setFailed(
      'resolve-baseline: GITHUB_TOKEN, GITHUB_REPOSITORY, BASELINE_BRANCH, BASELINE_WORKFLOW and BASELINE_ARTIFACT are all required.',
    );
    return;
  }

  const github = getOctokit(token);

  info(`==> Repository: ${owner}/${repo}`);
  info(`==> Workflow: ${workflowId}`);
  info(`==> Branch: ${branch}`);
  info(`==> Artifact: ${artifactName}`);

  const { data: commits } = await github.rest.repos.listCommits({
    owner,
    repo,
    sha: branch,
    per_page: MAX_COMMITS,
  });

  info(`==> Walking the last ${commits.length} commits of ${branch}`);

  /**
   * First of `runs` that still holds a downloadable baseline artifact.
   *
   * @param runs {{id: number}[]}
   */
  async function findArtifact(runs) {
    for (const workflowRun of runs) {
      const artifacts = await github.paginate(
        github.rest.actions.listWorkflowRunArtifacts,
        { owner, repo, run_id: workflowRun.id, per_page: PER_PAGE },
      );

      const artifact = artifacts.find(
        ({ name, expired }) => name === artifactName && !expired,
      );

      if (artifact) {
        return { workflowRun, artifact };
      }

      info(
        `==> (skipped) run ${workflowRun.id}: no usable "${artifactName}" artifact`,
      );
    }

    return null;
  }

  for (const commit of commits) {
    const { data } = await github.rest.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: workflowId,
      head_sha: commit.sha,
      per_page: PER_PAGE,
    });

    const runs = data.workflow_runs.filter(
      (workflowRun) =>
        workflowRun.id !== currentRunId &&
        workflowRun.status === 'completed' &&
        workflowRun.conclusion === 'success' &&
        workflowRun.head_repository?.full_name === `${owner}/${repo}`,
    );

    if (runs.length === 0) {
      info(`==> (skipped) ${commit.sha}: no successful run`);
      continue;
    }

    // A commit can have several runs (re-runs, or a PR run alongside the push
    // run that merged it). Prefer the latest, but keep trying its siblings —
    // an artifact can be missing from one run and present on another.
    runs.sort(
      (a, b) =>
        Date.parse(b.created_at) - Date.parse(a.created_at) || b.id - a.id,
    );

    const baseline = await findArtifact(runs);

    if (!baseline) {
      info(
        `==> (skipped) ${commit.sha}: no run with a usable "${artifactName}" artifact`,
      );
      continue;
    }

    const { workflowRun, artifact } = baseline;

    info(`==> (found) Run ID: ${workflowRun.id}`);
    info(`==> (found) Run date: ${workflowRun.created_at}`);
    info(`==> (found) Commit: ${commit.sha}`);
    info(`==> (found) Artifact ID: ${artifact.id}`);

    setOutput('found', 'true');
    setOutput('run-id', String(workflowRun.id));
    setOutput('run-url', workflowRun.html_url);
    setOutput('head-sha', commit.sha);
    setOutput('created-at', workflowRun.created_at);

    return;
  }

  warning(
    `None of the last ${commits.length} commits on "${branch}" has a successful "${workflowId}" run with a usable "${artifactName}" artifact — the size report will have no baseline to compare against.`,
  );
  setOutput('found', 'false');
}

await run();

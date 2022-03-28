import { context, GitHub } from '@actions/github';
import { setFailed } from '@actions/core';
import { exec } from '@actions/exec';
import table from 'markdown-table';
import bytes from 'bytes';
import dedent from 'dedent';
import { createMeasurer, deleteMeasurer } from '../size-limit.js'

const SIZE_LIMIT_HEADING = `## size-limit report 📦 `;

async function run() {
  const { payload, repo } = context;
  const pr = payload.pull_request;

  const token = process.env.GH_TOKEN;

  const octokit = new GitHub(token);

  let output = '';

  createMeasurer();
  await exec('npx size-limit --json', [],{
    ignoreReturnCode: true,
    listeners: {
      stdout: (data) => {
        output += data.toString();
      },
    },
  });
  deleteMeasurer();

  /**
   * @type {[]}
   */
  const jsonOutput = JSON.parse(output);

  const formattedTable = table([
    ['Name', 'Size', 'Time', 'Passed?'],
    ...jsonOutput.map((entry) => [
      entry.name,
      formatBytes(entry.size),
      formatTime(entry.loading),
      entry.passed ? '🎉' : '👎',
    ]),
  ]);

  const commentList = await octokit.paginate(
    'GET /repos/:owner/:repo/issues/:issue_number/comments',
    {
      ...repo,
      // eslint-disable-next-line camelcase
      issue_number: pr.number,
    },
  );

  const commentBody = dedent`
    ${SIZE_LIMIT_HEADING}

    ${formattedTable}
  `;

  const sizeLimitComment = commentList.find((comment) =>
    comment.body.startsWith(SIZE_LIMIT_HEADING),
  );

  if (!sizeLimitComment) {
    await octokit.issues.createComment({
      ...repo,
      // eslint-disable-next-line camelcase
      issue_number: pr.number,
      body: commentBody,
    });
  } else {
    await octokit.issues.updateComment({
      ...repo,
      // eslint-disable-next-line camelcase
      comment_id: sizeLimitComment.id,
      body: commentBody,
    });
  }

  if (jsonOutput.some((entry) => entry.passed === false)) {
    setFailed('Size limit has been exceeded.');
  }
}

function formatTime(seconds) {
  if (seconds >= 1) {
    return `${Math.ceil(seconds * 10) / 10} s`;
  }

  return `${Math.ceil(seconds * 1000)} ms`;
}

function formatBytes(size) {
  return bytes.format(size, { unitSeparator: ' ' });
}

run();

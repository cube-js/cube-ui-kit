import { context, GitHub } from '@actions/github';
import { setFailed } from '@actions/core';
import { exec } from '@actions/exec';
import table from 'markdown-table';
import bytes from 'bytes';
import { createMeasurer, deleteMeasurer } from '../size-limit.js';
import setMessage from './set-message.js';

const SIZE_LIMIT_HEADING = `## size-limit report 📦 `;

async function run() {
  const { payload, repo } = context;
  const pr = payload.pull_request;

  const token = process.env.GH_TOKEN;

  const github = new GitHub(token);

  let output = '';

  createMeasurer();
  await exec('npx size-limit --json', [], {
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

  setMessage({
    header: SIZE_LIMIT_HEADING,
    body: formattedTable,
    prNumber: pr.number,
    repo,
    github,
  });

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

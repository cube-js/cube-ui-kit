import { readFile } from 'node:fs/promises';

import { setFailed, setOutput } from '@actions/core';
import { getExecOutput } from '@actions/exec';
import bytes from 'bytes';
import { markdownTable } from 'markdown-table';

async function run() {
  /**
   * @type {{size: number, name: string, passed: boolean}[] | null}
   */
  const baselineOutputs = await (async () => {
    try {
      const baselineRawJson = await readFile(process.env.BASELINE, 'utf-8');
      return JSON.parse(baselineRawJson);
    } catch (e) {
      console.warn(e);
      return null;
    }
  })();

  /**
   * @type {{size: number, name: string, passed: boolean}[]}
   */
  const jsonOutput = await (async () => {
    const { stdout } = await getExecOutput('npx size-limit', ['--json'], {
      ignoreReturnCode: true,
    });

    return JSON.parse(stdout);
  })();

  const formattedTable = markdownTable([
    ['Name', 'Size', 'Passed?'],
    ...jsonOutput.map((entry) => {
      const currentBaselineEntry = baselineOutputs?.find(
        ({ name }) => name === entry.name,
      );

      return [
        entry.name,
        `${formatBytes(entry.size)} (${
          currentBaselineEntry
            ? compareSizeWithBaseline(entry.size, currentBaselineEntry.size)
            : 'Baseline not found'
        })`,
        entry.passed ? 'Yes 🎉' : 'No 👎',
      ];
    }),
  ]);

  setOutput('result', jsonOutput);
  setOutput(
    'table',
    `${formattedTable}\n\n${describeBaseline(baselineOutputs)}`,
  );

  if (jsonOutput.some((entry) => entry.passed === false)) {
    setFailed('Size limit has been exceeded.');
  }
}

/**
 * Spells out which run the baseline came from, so a stale or missing
 * comparison is visible in the PR comment instead of silently misleading.
 *
 * The result is spliced into a JS template literal by the workflow, so it must
 * never contain backticks or `${`.
 *
 * @param baselineOutputs {unknown | null}
 * @return {string}
 */
function describeBaseline(baselineOutputs) {
  const branch = process.env.BASELINE_BRANCH;
  const runId = process.env.BASELINE_RUN_ID;
  const runUrl = process.env.BASELINE_RUN_URL;
  const sha = process.env.BASELINE_SHA;
  const createdAt = process.env.BASELINE_CREATED_AT;

  if (!runId) {
    return `> ⚠️ **No baseline found**${
      branch ? ` for **${branch}**` : ''
    } — the sizes above are absolute, with nothing to compare them to.`;
  }

  if (!baselineOutputs) {
    return `> ⚠️ **Baseline stats could not be read** from [run ${runId}](${runUrl}) — the sizes above are absolute, with nothing to compare them to.`;
  }

  const commitUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/commit/${sha}`;

  return `Compared against **${branch}** at [${sha?.slice(
    0,
    7,
  )}](${commitUrl}) — [run ${runId}](${runUrl}), ${createdAt}.`;
}

/**
 * @param size {number}
 * @return {string | null}
 */
function formatBytes(size) {
  return bytes.format(size, { unitSeparator: ' ' });
}

/**
 * @param current {number}
 * @param baseline {number}
 * @return {string}
 */
function compareSizeWithBaseline(current, baseline) {
  if (baseline === 0) {
    return '+100% 🔺';
  }

  const value = ((current - baseline) / baseline) * 100;
  const formatted = (Math.sign(value) * Math.ceil(Math.abs(value) * 100)) / 100;

  if (value > 0) {
    return `+${formatted}% 🔺`;
  }

  if (value === 0) {
    return `${formatted}% 🟰`;
  }

  return `${formatted}% 🔽👏`;
}

await run();

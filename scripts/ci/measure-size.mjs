import { readFile } from 'node:fs/promises';
import { setFailed, setOutput } from '@actions/core';
import { getExecOutput } from '@actions/exec';
import { markdownTable } from 'markdown-table';
import bytes from 'bytes';

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
  setOutput('table', formattedTable);

  if (jsonOutput.some((entry) => entry.passed === false)) {
    setFailed('Size limit has been exceeded.');
  }
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

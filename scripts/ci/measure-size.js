import { readFile } from 'node:fs/promises';

import { setFailed, setOutput } from '@actions/core';
import { getExecOutput } from '@actions/exec';
import bytes from 'bytes';
import { markdownTable } from 'markdown-table';

import {
  compareSizes,
  formatPackageReport,
  packageSizes,
  readBaseline as readApprovedPackages,
  readStats,
} from '../bundle-deps.mjs';

/** The entry the partial imports are measured against (`.size-limit.cjs`). */
const FULL_ENTRY = 'All';

/**
 * A partial import may weigh at most this share of the full bundle. `{ Button }`
 * was 24% of it in August 2026 and 26% in October; a broken `sideEffects` flag
 * or a barrel import makes webpack keep most of the library, which pushes the
 * share toward 100%. This replaces a byte limit that every feature had to raise.
 */
const MAX_PARTIAL_SHARE = 0.35;

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

  const full = jsonOutput.find(({ name }) => name === FULL_ENTRY);

  if (!full) {
    throw new Error(`.size-limit.cjs has no "${FULL_ENTRY}" entry.`);
  }

  const failures = [];

  const formattedTable = markdownTable([
    ['Name', 'Size', 'Change'],
    ...jsonOutput.map((entry) => {
      const currentBaselineEntry = baselineOutputs?.find(
        ({ name }) => name === entry.name,
      );
      let size = formatBytes(entry.size);

      if (entry !== full) {
        const share = entry.size / full.size;

        size += ` · ${formatShare(share)} of ${FULL_ENTRY}`;

        if (share > MAX_PARTIAL_SHARE) {
          size += ' ❌';
          failures.push(
            `"${entry.name}" is ${formatShare(share)} of the full bundle, over ${formatShare(MAX_PARTIAL_SHARE)}: tree-shaking no longer drops the rest of the library.`,
          );
        }
      }

      return [
        entry.name,
        size,
        currentBaselineEntry
          ? compareSizeWithBaseline(entry.size, currentBaselineEntry.size)
          : 'Baseline not found',
      ];
    }),
  ]);

  const packageChanges = compareSizes(
    packageSizes(readStats(process.env.REPORT_FOLDER ?? './size-limit-report')),
    readApprovedPackages(),
  );

  if (packageChanges.some(({ blocking }) => blocking)) {
    failures.push(
      'A third-party package entered the bundle or grew past its approved size.',
    );
  }

  setOutput('result', jsonOutput);
  setOutput(
    'table',
    [
      formattedTable,
      describeBaseline(baselineOutputs),
      '### Third-party packages',
      formatPackageReport(packageChanges),
    ].join('\n\n'),
  );

  if (failures.length) {
    setFailed(failures.join('\n'));
  }
}

/**
 * @param share {number}
 * @return {string}
 */
function formatShare(share) {
  return `${Math.round(share * 1000) / 10}%`;
}

/**
 * Spells out which run the baseline came from, so a stale or missing
 * comparison is visible in the PR comment instead of silently misleading.
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

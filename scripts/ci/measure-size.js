import { readFile } from 'node:fs/promises';

import { setFailed, setOutput } from '@actions/core';
import { getExecOutput } from '@actions/exec';
import { markdownTable } from 'markdown-table';

import { checkPackages, formatSize } from '../bundle-deps.mjs';

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
   * @type {{size: number, name: string}[] | null}
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
   * @type {{size: number, name: string}[]}
   */
  const jsonOutput = await (async () => {
    const { stdout } = await getExecOutput('npx size-limit', ['--json'], {
      ignoreReturnCode: true,
    });

    return JSON.parse(stdout);
  })();

  // Saved as the next baseline on `main`, so it is written before anything
  // below can throw.
  setOutput('result', jsonOutput);

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
      let size = formatSize(entry.size);

      if (entry !== full) {
        const failure = checkShare(entry, full);

        size += ` · ${formatShare(entry.size / full.size)} of ${FULL_ENTRY}`;

        if (failure) {
          size += ' ❌';
          failures.push(failure);
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

  let packageReport;

  try {
    const { failed, report } = checkPackages();

    if (failed) {
      failures.push(
        'A third-party package entered or left the bundle, or grew more than 10 KB past its approved size.',
      );
    }

    packageReport = report;
  } catch (error) {
    failures.push(
      `The third-party package check could not run: ${error.message}`,
    );
    packageReport = `❌ **The third-party package check could not run**: ${error.message}`;
  }

  setOutput(
    'table',
    [
      formattedTable,
      describeBaseline(baselineOutputs),
      '### Third-party packages',
      packageReport,
    ].join('\n\n'),
  );

  if (failures.length) {
    setFailed(failures.join('\n'));
  }
}

/**
 * The failure for a partial import that weighs too much of the full bundle,
 * or `null` when it passes.
 *
 * @param entry {{size: number, name: string}}
 * @param full {{size: number, name: string}}
 * @return {string | null}
 */
export function checkShare(entry, full) {
  const share = entry.size / full.size;

  return share > MAX_PARTIAL_SHARE
    ? `"${entry.name}" is ${formatShare(share)} of the full bundle, over ${formatShare(MAX_PARTIAL_SHARE)}: tree-shaking no longer drops the rest of the library.`
    : null;
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

if (import.meta.main) {
  await run();
}

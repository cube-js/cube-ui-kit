#!/usr/bin/env node
/**
 * `pnpm diagnostics:a11y` — what axe-core finds in every story.
 *
 * Renders each story out of `storybook-static` in real Chromium, waits for its
 * `play` function and for the DOM to settle (the moment Chromatic photographs),
 * and runs axe-core against WCAG 2.2 A/AA plus axe's best practices. Real
 * Chromium matters: colour contrast, target size and visibility all need
 * layout, which jsdom does not have.
 *
 * `scripts/a11y-baseline.json` records how many elements fail each rule in
 * each story. `--check` fails when any story fails a rule on more elements than
 * the baseline allows — including a new story with any violation at all — and
 * `--update` rewrites it after a fix. The baseline only ever has to go down;
 * growth from `--update` shows in its diff and needs a reason in the PR. An
 * axe-core upgrade changes what the rules find, so it is pinned exactly and
 * updated together with the baseline.
 *
 * A story whose counts differ from the baseline is rendered a second time on
 * its own before the difference counts, and only a change both renders agree
 * on is reported or recorded. A story that settles a little differently under
 * load must not fail CI or slip a lower number into the baseline.
 *
 * Build first, this reads the static output:
 *
 *   pnpm build-storybook
 *
 * Usage:
 *   pnpm diagnostics:a11y                         # report, compared with the baseline
 *   pnpm diagnostics:a11y --check                 # fail on anything above the baseline
 *   pnpm diagnostics:a11y --update                # rewrite the baseline
 *   pnpm diagnostics:a11y --filter Actions/Button # only matching titles or ids
 *   pnpm diagnostics:a11y --verbose               # every violation, with its elements
 *   pnpm diagnostics:a11y --json report.json      # raw results
 *   pnpm diagnostics:a11y --concurrency 8
 *
 * With `--filter`, `--update` rewrites only the entries of the stories it ran.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const baselinePath = resolve(root, 'scripts/a11y-baseline.json');

/** WCAG 2.0–2.2 at levels A and AA, plus axe's own best practices. */
const TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
  'best-practice',
];

/** Rules that are switched off, each for a reason that holds for every story. */
const OFF_RULES = [
  // Rules about the page as a whole. A story renders one component, or several
  // instances of it side by side, inside Storybook's iframe — it is not a page,
  // so it has no `<main>`, no `<h1>`, no title of its own and no skip link, and
  // these rules would fail on every story without saying anything about it.
  'bypass',
  'document-title',
  'html-has-lang',
  'landmark-complementary-is-top-level',
  'landmark-no-duplicate-main',
  'landmark-one-main',
  'landmark-unique',
  'page-has-heading-one',
  'region',
  // WCAG 2.5.3, Label in Name. React Aria names an option or menu item by its
  // label (`aria-labelledby`) and links its description and hotkey through
  // `aria-describedby`. The rule compares the name with the item's whole
  // visible text, so a "Copy ⌃ C" item named "Copy" fails although its name is
  // exactly its visible label. That is every ListBox, Menu and CommandMenu item
  // with a description or a hotkey, and every new story showing one.
  'label-content-name-mismatch',
];

const IMPACTS = ['critical', 'serious', 'moderate', 'minor'];

/**
 * CI and Chromatic render on Linux, and the baseline holds Linux's counts.
 * Text set in a system font stack (`system-ui`, `ui-monospace`) gets other
 * fonts elsewhere, so a geometry rule can count differently: the DateInput
 * segments sit 24px apart on macOS and closer on Linux, so `target-size`
 * passes on one and fails on the other.
 */
const BASELINE_PLATFORM = 'linux';

// ─── In the page ─────────────────────────────────────────────────────────────

/**
 * Runs in the page. Replaces background layers that are one solid colour with
 * the colour they paint, so axe can measure the contrast on top of them.
 *
 * tasty compiles a two-colour `fill` (`'#surface #primary.10'`) to the first
 * colour plus a `linear-gradient(c, c)` layer holding the second, in every
 * state, so the overlay can transition. axe gives up on any background image —
 * "background color could not be determined due to a background gradient" — so
 * without this every Button, Item and table cell would be left unchecked
 * (tenphi/tasty#436). A layer only counts as solid when every stop of every
 * layer is the same colour; a real gradient or image is left alone and stays
 * inconclusive. The canvas composites in sRGB, as the browser does.
 */
const FLATTEN_SOLID_LAYERS = () => {
  const splitTopLevel = (value) => {
    const parts = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === '(') depth++;
      else if (value[i] === ')') depth--;
      else if (value[i] === ',' && depth === 0) {
        parts.push(value.slice(start, i).trim());
        start = i + 1;
      }
    }
    parts.push(value.slice(start).trim());
    return parts;
  };

  const solidColor = (layer) => {
    const inner = /^linear-gradient\((.*)\)$/s.exec(layer)?.[1];
    if (!inner) return null;
    const args = splitTopLevel(inner);
    // The computed value drops the default direction; any other comes first.
    if (/^(to |-?[\d.]+(deg|grad|rad|turn)$)/.test(args[0])) args.shift();
    const colors = args.map((stop) =>
      stop.replace(/(\s+-?[\d.]+(%|px)?)+$/, ''),
    );
    return colors.every((color) => color === colors[0]) ? colors[0] : null;
  };

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let flattened = 0;

  for (const el of document.querySelectorAll('*')) {
    const style = getComputedStyle(el);
    if (!style.backgroundImage.startsWith('linear-gradient(')) continue;
    if (style.backgroundClip.includes('text')) continue;

    const layers = splitTopLevel(style.backgroundImage).map(solidColor);
    if (layers.includes(null)) continue;

    // The colour paints first, then the image layers from last to first.
    ctx.clearRect(0, 0, 1, 1);
    for (const color of [style.backgroundColor, ...layers.reverse()]) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
    }
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;

    // Item themes transition their fill. Without this, swapping the layers for
    // one colour starts a transition from the old background, and axe reads
    // whatever point of it the machine's load has reached.
    el.style.setProperty('transition', 'none', 'important');
    el.style.setProperty(
      'background-color',
      `rgb(${r} ${g} ${b} / ${a / 255})`,
      'important',
    );
    el.style.setProperty('background-image', 'none', 'important');
    flattened++;
  }

  return flattened;
};

/** Runs in the page, after axe-core is injected. */
const RUN_AXE = async ({ tags, offRules }) => {
  const result = await window.axe.run(
    { exclude: [['#storybook-docs']] },
    {
      runOnly: { type: 'tag', values: tags },
      rules: Object.fromEntries(offRules.map((id) => [id, { enabled: false }])),
      resultTypes: ['violations'],
    },
  );

  return {
    violations: result.violations.map((v) => ({
      rule: v.id,
      impact: v.impact,
      nodes: v.nodes.length,
      targets: v.nodes.slice(0, 3).map((node) => node.target.join(' ')),
      // "Fix any of the following:" and then one line per failed check; the
      // first check says what is wrong, the rest list ways it could be fixed.
      summary: (v.nodes[0]?.failureSummary ?? '').split('\n')[1]?.trim() ?? '',
    })),
    incomplete: Object.fromEntries(
      result.incomplete.map((v) => [v.id, v.nodes.length]),
    ),
  };
};

// ─── Baseline ────────────────────────────────────────────────────────────────

const sortKeys = (object) =>
  Object.fromEntries(
    Object.entries(object).sort(([a], [b]) => a.localeCompare(b)),
  );

/** `{ [storyId]: { [rule]: elements } }` for every story with a violation. */
export function countsOf(results) {
  const counts = {};
  for (const result of results) {
    if (result.error || !result.violations.length) continue;
    counts[result.id] = sortKeys(
      Object.fromEntries(result.violations.map((v) => [v.rule, v.nodes])),
    );
  }
  return sortKeys(counts);
}

/** Every story and rule where `current` differs from `baseline`, for `ids`. */
export function differences(current, baseline, ids) {
  const changes = [];
  for (const id of ids) {
    const rules = new Set([
      ...Object.keys(current[id] ?? {}),
      ...Object.keys(baseline[id] ?? {}),
    ]);
    for (const rule of [...rules].sort()) {
      const before = baseline[id]?.[rule] ?? 0;
      const after = current[id]?.[rule] ?? 0;
      if (after !== before) changes.push({ id, rule, before, after });
    }
  }
  return changes;
}

/**
 * The count two renders agree on: a change counts only when both moved the
 * same way, and then only as far as the smaller move.
 */
export function confirmCount(before, first, second) {
  if (first > before && second > before) return Math.min(first, second);
  if (first < before && second < before) return Math.max(first, second);
  return before;
}

/**
 * Replaces the entries of the stories in `ids` with `current`, keeping every
 * other entry. `knownIds`, when given, drops entries for stories that no longer
 * exist.
 */
export function mergeBaseline(baseline, current, ids, knownIds) {
  const ran = new Set(ids);
  const known = knownIds ? new Set(knownIds) : null;
  const next = {};
  for (const [id, rules] of Object.entries(baseline)) {
    if (!ran.has(id) && (!known || known.has(id))) next[id] = rules;
  }
  for (const id of ids) {
    if (current[id]) next[id] = current[id];
  }
  return sortKeys(next);
}

export function totalsOf(stories) {
  const totals = {};
  for (const rules of Object.values(stories)) {
    for (const [rule, count] of Object.entries(rules)) {
      totals[rule] = (totals[rule] ?? 0) + count;
    }
  }
  return sortKeys(totals);
}

// ─── Run ─────────────────────────────────────────────────────────────────────

function readBaseline() {
  try {
    return JSON.parse(readFileSync(baselinePath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return null;
  }
}

async function writeBaseline(baseline) {
  const prettier = await import('prettier');
  writeFileSync(
    baselinePath,
    await prettier.format(JSON.stringify(baseline), {
      ...(await prettier.resolveConfig(baselinePath)),
      filepath: baselinePath,
    }),
  );
}

async function audit(stories, concurrency) {
  // Loaded here, not at the top, so the unit tests of the baseline logic above
  // do not start Playwright.
  const { runStories } = await import('./lib/storybook-runner.mjs');
  const axeSource = readFileSync(
    require.resolve('axe-core/axe.min.js'),
    'utf8',
  );

  return runStories(stories, {
    concurrency,
    async visit(page, story, finished) {
      const flattened = await page.evaluate(FLATTEN_SOLID_LAYERS);
      await page.addScriptTag({ content: axeSource });
      const { violations, incomplete } = await page.evaluate(RUN_AXE, {
        tags: TAGS,
        offRules: OFF_RULES,
      });

      return {
        id: story.id,
        title: story.title,
        name: story.name,
        importPath: story.importPath,
        playStatus: finished?.status ?? 'unknown',
        flattened,
        violations,
        incomplete,
      };
    },
  });
}

function printSummary(results, baselineStories) {
  const ok = results.filter((r) => !r.error);
  const clean = ok.filter((r) => !r.violations.length);
  const byImpact = Object.fromEntries(IMPACTS.map((impact) => [impact, 0]));
  const byRule = {};
  const incomplete = {};
  let flattened = 0;

  for (const r of ok) {
    flattened += r.flattened;
    for (const v of r.violations) {
      byImpact[v.impact] += v.nodes;
      byRule[v.rule] ??= { impact: v.impact, stories: 0, elements: 0 };
      byRule[v.rule].stories++;
      byRule[v.rule].elements += v.nodes;
    }
    for (const [rule, count] of Object.entries(r.incomplete)) {
      incomplete[rule] = (incomplete[rule] ?? 0) + count;
    }
  }

  const elements = Object.values(byImpact).reduce((a, b) => a + b, 0);
  const percent = ok.length ? Math.round((clean.length / ok.length) * 100) : 0;
  const ran = new Set(ok.map((r) => r.id));
  const baselineTotals = totalsOf(
    Object.fromEntries(
      Object.entries(baselineStories).filter(([id]) => ran.has(id)),
    ),
  );

  console.log(
    `\n${ok.length} stories, ${clean.length} with no violations (${percent}%). ${elements} failing elements: ${IMPACTS.map((i) => `${byImpact[i]} ${i}`).join(', ')}.`,
  );

  const rules = Object.entries(byRule).sort(
    (a, b) => b[1].elements - a[1].elements,
  );
  if (rules.length) {
    console.log(
      `\n  ${'rule'.padEnd(30)} ${'impact'.padEnd(9)} stories  elements  baseline`,
    );
    for (const [rule, { impact, stories, elements: count }] of rules) {
      console.log(
        `  ${rule.padEnd(30)} ${impact.padEnd(9)} ${String(stories).padStart(7)}  ${String(count).padStart(8)}  ${String(baselineTotals[rule] ?? 0).padStart(8)}`,
      );
    }
  }

  const inconclusive = Object.entries(incomplete)
    .sort((a, b) => b[1] - a[1])
    .map(([rule, count]) => `${rule} ${count}`);
  if (inconclusive.length) {
    console.log(
      `\nInconclusive, axe could not decide (not counted): ${inconclusive.join(', ')}.`,
    );
  }
  console.log(
    `Flattened ${flattened} solid background layers so their contrast could be measured.`,
  );
}

function printVerbose(results) {
  for (const r of results) {
    if (r.error || !r.violations.length) continue;
    console.log(`\n${r.title} / ${r.name}  (${r.id})`);
    for (const v of r.violations) {
      console.log(`  ${v.rule} [${v.impact}] ×${v.nodes}  ${v.summary}`);
      for (const target of v.targets) console.log(`      ${target}`);
    }
  }
}

function describeChange(change, results) {
  const violation = results
    .find((r) => r.id === change.id)
    ?.violations.find((v) => v.rule === change.rule);
  const lines = [
    `  ${change.id} [${change.rule}]: ${change.before} -> ${change.after}`,
  ];
  if (violation && change.after > change.before) {
    lines.push(`      ${violation.summary}`);
    lines.push(`      ${violation.targets[0]}`);
  }
  return lines.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const has = (name) => args.includes(name);
  const flag = (name, fallback) => {
    const i = args.indexOf(name);
    return i === -1 ? fallback : args[i + 1];
  };

  const check = has('--check');
  const update = has('--update');
  const filter = flag('--filter', null);
  const jsonOut = flag('--json', null);
  const concurrency = Number(flag('--concurrency', 6));
  const axeVersion = require('axe-core/package.json').version;

  const { readStories } = await import('./lib/storybook-runner.mjs');

  const baseline = readBaseline();
  if (check && !baseline) {
    console.error(
      `No baseline at ${baselinePath}. Create it with \`pnpm diagnostics:a11y --update\`.`,
    );
    process.exit(1);
  }
  const baselineStories = baseline?.stories ?? {};
  if (baseline && baseline.tooling['axe-core'] !== axeVersion) {
    console.warn(
      `The baseline was recorded with axe-core ${baseline.tooling['axe-core']}, and ${axeVersion} is installed. Its rules may find different things; update the baseline in the same change as axe-core.`,
    );
  }

  const stories = readStories(filter);
  console.log(`Running axe-core ${axeVersion} on ${stories.length} stories …`);
  if (process.platform !== BASELINE_PLATFORM) {
    console.warn(
      `The baseline holds the counts CI sees on Linux. On ${process.platform}, text in system font stacks lays out differently, so geometry rules such as target-size can count differently here. Where this run and CI disagree, record CI's counts; the failing job prints each one.`,
    );
  }

  let results = await audit(stories, concurrency);
  const ids = stories.map((s) => s.id);

  // Render every story that changed — or failed to render — a second time, on
  // its own, and keep only what both renders agree on.
  const first = countsOf(results);
  let unstable = [];
  const suspects = new Set([
    ...differences(first, baselineStories, ids).map((c) => c.id),
    ...results.filter((r) => r.error).map((r) => r.id),
  ]);
  if (suspects.size) {
    console.log(
      `Rendering ${suspects.size} stories again to confirm their changes …`,
    );
    const again = await audit(
      stories.filter((s) => suspects.has(s.id)),
      1,
    );
    const second = countsOf(again);
    const byId = new Map(again.map((r) => [r.id, r]));
    unstable = again
      .filter((r) => !r.error && !results.find((f) => f.id === r.id)?.error)
      .filter((r) => differences(second, first, [r.id]).length)
      .map((r) => r.id);

    results = results.map((r) => {
      const retry = byId.get(r.id);
      if (!retry) return r;
      if (r.error || retry.error) return retry;

      const rules = new Set([
        ...r.violations.map((v) => v.rule),
        ...retry.violations.map((v) => v.rule),
        ...Object.keys(baselineStories[r.id] ?? {}),
      ]);
      const violations = [];
      for (const rule of rules) {
        const nodes = confirmCount(
          baselineStories[r.id]?.[rule] ?? 0,
          first[r.id]?.[rule] ?? 0,
          second[r.id]?.[rule] ?? 0,
        );
        if (!nodes) continue;
        // A count above zero means at least one render failed the rule.
        const detail =
          r.violations.find((v) => v.rule === rule) ??
          retry.violations.find((v) => v.rule === rule);
        violations.push({ ...detail, nodes });
      }
      return { ...r, violations };
    });
  }

  const current = countsOf(results);
  const failed = results.filter((r) => r.error);
  const failedIds = new Set(failed.map((r) => r.id));
  const measuredIds = ids.filter((id) => !failedIds.has(id));
  const changes = differences(current, baselineStories, measuredIds);
  const grown = changes.filter((c) => c.after > c.before);
  const shrunk = changes.filter((c) => c.after < c.before);
  const knownIds = filter ? null : new Set(ids);
  const stale = knownIds
    ? Object.keys(baselineStories).filter((id) => !knownIds.has(id))
    : [];

  printSummary(results, baselineStories);
  if (has('--verbose')) printVerbose(results);

  if (jsonOut) {
    writeFileSync(jsonOut, JSON.stringify(results, null, 2));
    console.log(`Wrote ${jsonOut}`);
  }

  // A story whose result depends on timing slows every run and blurs the
  // baseline; worth making deterministic, as `useServerQuery` in the ItemTable
  // stories was.
  if (unstable.length) {
    console.log(
      `\n${unstable.length} stories rendered differently twice in a row; only what both renders agree on counts:`,
    );
    for (const id of unstable) console.log(`  ${id}`);
  }

  if (failed.length) {
    console.log(`\n${failed.length} stories failed to render twice:`);
    for (const r of failed) console.log(`  ${r.id}: ${r.error}`);
  }

  // On the first `--update` everything is new; listing it would be the whole report.
  if (grown.length && baseline) {
    console.log(
      `\n${grown.length} rules fail on more elements than the baseline allows:`,
    );
    for (const change of grown) console.log(describeChange(change, results));
  }

  if (update) {
    const stories = mergeBaseline(
      baselineStories,
      current,
      measuredIds,
      knownIds,
    );
    await writeBaseline({
      tooling: { 'axe-core': axeVersion },
      totals: totalsOf(stories),
      stories,
    });
    console.log(
      `\nBaseline updated: ${shrunk.length} lowered, ${grown.length} raised${stale.length ? `, ${stale.length} removed stories dropped` : ''}.`,
    );
    if (grown.length && baseline) {
      console.log(
        'A raised baseline needs a reason in the PR; the counts above are what reviewers will see.',
      );
    }
    return;
  }

  if (shrunk.length) {
    console.log(
      `\n${shrunk.length} rules now fail on fewer elements than the baseline. ${
        process.platform === BASELINE_PLATFORM
          ? 'Lock that in with `pnpm diagnostics:a11y --update`.'
          : 'Lock in only what CI sees as well; see the note on platforms above.'
      }`,
    );
  }
  if (stale.length) {
    console.log(
      `${stale.length} baseline entries are for stories that no longer exist; \`--update\` drops them.`,
    );
  }

  if (check) {
    if (grown.length || failed.length) {
      console.log(
        '\nFix the new violations, or run `pnpm diagnostics:a11y --update` and explain the raise in the PR.',
      );
      process.exit(1);
    }
    console.log('\nNo story fails more than the baseline allows.');
  }
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
)
  await main();

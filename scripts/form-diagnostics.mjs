#!/usr/bin/env node
/**
 * Report-only React Hooks / React Compiler diagnostics for the Form surface.
 *
 * Runs the official `eslint-plugin-react-hooks` (v7, compiler-backed) rules —
 * via `eslint.hooks.config.mjs` — over the shared Form code and the input
 * components, and compares the findings against a committed baseline.
 *
 *   pnpm diagnostics:form            print the report (never fails)
 *   pnpm diagnostics:form --check    fail if any file+rule count grew
 *   pnpm diagnostics:form --update   rewrite the baseline from the current run
 *   pnpm diagnostics:form --verbose  list every message, not just the counts
 *   pnpm diagnostics:form --json     print the raw report as JSON
 *
 * The baseline is a ratchet: counts may go down freely, and a decrease should
 * be committed with `--update`; an increase fails `--check`. Zero is not yet a
 * requirement — see the Form modernization plan, §8.1, and the legacy contract
 * README next to the baseline file.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

const BASELINE_PATH = join(
  root,
  'src/components/form/Form/legacy-contract/diagnostics-baseline.json',
);

/**
 * What "the Form surface" means for this report. Shared presentation/input
 * code and the legacy engine are listed separately so the README can talk about
 * them separately; the ESLint config's `ignores` drops tests and stories.
 */
const SCOPE = {
  'legacy engine': [
    'src/components/form/Form/Form.tsx',
    'src/components/form/Form/use-form.tsx',
    'src/components/form/Form/validation.ts',
    'src/components/form/Form/use-field/**/*.{ts,tsx}',
    'src/components/form/Form/Field.tsx',
  ],
  'shared form surface': [
    'src/components/form/**/*.{ts,tsx}',
    'src/components/overlays/Dialog/DialogForm.tsx',
    'src/shared/form.ts',
  ],
  'input components': ['src/components/fields/**/*.{ts,tsx}'],
};

const args = new Set(process.argv.slice(2));
const flags = {
  check: args.has('--check'),
  update: args.has('--update'),
  verbose: args.has('--verbose'),
  json: args.has('--json'),
};

function toPosix(path) {
  return path.split('\\').join('/');
}

async function lint() {
  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: join(root, 'eslint.hooks.config.mjs'),
    errorOnUnmatchedPattern: false,
  });

  const patterns = [...new Set(Object.values(SCOPE).flat())];
  const results = await eslint.lintFiles(patterns);

  const messages = [];

  for (const result of results) {
    const file = toPosix(relative(root, result.filePath));

    for (const message of result.messages) {
      messages.push({
        file,
        line: message.line ?? 0,
        column: message.column ?? 0,
        rule: message.ruleId ?? (message.fatal ? 'parse-error' : 'unknown'),
        message: message.message,
      });
    }
  }

  messages.sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      a.line - b.line ||
      a.column - b.column ||
      a.rule.localeCompare(b.rule),
  );

  return { filesLinted: results.length, messages };
}

function aggregate(messages) {
  const totals = {};
  const files = {};

  for (const { file, rule } of messages) {
    totals[rule] = (totals[rule] ?? 0) + 1;
    files[file] ??= {};
    files[file][rule] = (files[file][rule] ?? 0) + 1;
  }

  const sortKeys = (object) =>
    Object.fromEntries(
      Object.keys(object)
        .sort()
        .map((key) => [
          key,
          typeof object[key] === 'object' ? sortKeys(object[key]) : object[key],
        ]),
    );

  return { totals: sortKeys(totals), files: sortKeys(files) };
}

function versionOf(pkg) {
  try {
    return require(`${pkg}/package.json`).version;
  } catch {
    return 'unknown';
  }
}

function readBaseline() {
  try {
    return JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  } catch {
    return null;
  }
}

/** Every (file, rule) whose count grew against the baseline. */
function regressions(current, baseline) {
  const grown = [];

  for (const [file, rules] of Object.entries(current.files)) {
    for (const [rule, count] of Object.entries(rules)) {
      const before = baseline?.files?.[file]?.[rule] ?? 0;

      if (count > before) {
        grown.push({ file, rule, before, after: count });
      }
    }
  }

  return grown;
}

function printReport({ filesLinted, messages }, aggregated, baseline) {
  const total = messages.length;
  const baselineTotal = baseline
    ? Object.values(baseline.totals).reduce((sum, n) => sum + n, 0)
    : null;

  console.log(
    `# Form surface — React Hooks / Compiler diagnostics (report-only)\n`,
  );
  console.log(`Files linted: ${filesLinted}`);
  console.log(
    `Diagnostics: ${total}${
      baselineTotal == null ? '' : ` (baseline ${baselineTotal})`
    }\n`,
  );

  console.log('| Rule | Count | Baseline |');
  console.log('| --- | ---: | ---: |');

  const rules = new Set([
    ...Object.keys(aggregated.totals),
    ...Object.keys(baseline?.totals ?? {}),
  ]);

  for (const rule of [...rules].sort()) {
    console.log(
      `| ${rule} | ${aggregated.totals[rule] ?? 0} | ${
        baseline?.totals?.[rule] ?? 0
      } |`,
    );
  }

  console.log('\n| File | Diagnostics |');
  console.log('| --- | ---: |');

  const byFile = Object.entries(aggregated.files)
    .map(([file, rules]) => [
      file,
      Object.values(rules).reduce((sum, n) => sum + n, 0),
    ])
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  for (const [file, count] of byFile) {
    console.log(`| ${file} | ${count} |`);
  }

  if (flags.verbose) {
    console.log('\n## Messages\n');

    for (const { file, line, column, rule, message } of messages) {
      console.log(`- ${file}:${line}:${column} [${rule}] ${message}`);
    }
  }
}

const lintResult = await lint();
const aggregated = aggregate(lintResult.messages);
const baseline = readBaseline();

const report = {
  generatedAt: new Date().toISOString(),
  tooling: {
    eslint: versionOf('eslint'),
    'eslint-plugin-react-hooks': versionOf('eslint-plugin-react-hooks'),
    '@typescript-eslint/parser': versionOf('@typescript-eslint/parser'),
  },
  scope: SCOPE,
  filesLinted: lintResult.filesLinted,
  totals: aggregated.totals,
  files: aggregated.files,
};

if (flags.json) {
  console.log(
    JSON.stringify({ ...report, messages: lintResult.messages }, null, 2),
  );
} else {
  printReport(lintResult, aggregated, baseline);
}

if (flags.update) {
  // Format through the repo's Prettier config so `pnpm prettier` stays green
  // and a re-run produces a byte-identical file.
  const prettier = await import('prettier');
  const options = await prettier.resolveConfig(BASELINE_PATH);
  const formatted = await prettier.format(JSON.stringify(report, null, 2), {
    ...options,
    filepath: BASELINE_PATH,
  });

  writeFileSync(BASELINE_PATH, formatted);
  console.log(`\nBaseline written to ${relative(root, BASELINE_PATH)}`);
}

if (flags.check) {
  if (!baseline) {
    console.error(
      `\nNo baseline at ${relative(root, BASELINE_PATH)}. Run with --update first.`,
    );
    process.exit(2);
  }

  const grown = regressions(aggregated, baseline);

  if (grown.length) {
    console.error('\nDiagnostics grew against the baseline:');

    for (const { file, rule, before, after } of grown) {
      console.error(`- ${file} [${rule}]: ${before} -> ${after}`);
    }

    console.error(
      '\nFix the new findings, or run `pnpm diagnostics:form --update` if the increase is reviewed and intended.',
    );
    process.exit(1);
  }

  console.log('\nNo diagnostics grew against the baseline.');
}

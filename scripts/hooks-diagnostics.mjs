#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';

import { runtimePatterns, strictHooksConfig } from '../eslint.hooks.config.mjs';

import { usesEffectEvent } from './hooks-policy.mjs';

const root = resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const baselinePath = resolve(root, 'scripts/hooks-baseline.json');
const formPatterns = [
  'src/components/form/**/*.{ts,tsx}',
  'src/components/fields/**/*.{ts,tsx}',
  'src/components/overlays/Dialog/DialogForm.tsx',
  'src/components/overlays/Dialog/ModernDialogForm.tsx',
  'src/shared/form.ts',
];

export function isFormFile(file) {
  return /^src\/(components\/(form|fields)\/|components\/overlays\/Dialog\/(Modern)?DialogForm\.tsx$|shared\/form\.ts$)/.test(
    file,
  );
}

export function aggregate(messages) {
  const files = {};
  const totals = {};
  for (const { file, rule } of messages) {
    files[file] ??= {};
    files[file][rule] = (files[file][rule] ?? 0) + 1;
    totals[rule] = (totals[rule] ?? 0) + 1;
  }
  const sorted = (object) =>
    Object.fromEntries(
      Object.entries(object).sort(([a], [b]) => a.localeCompare(b)),
    );
  return {
    files: sorted(
      Object.fromEntries(
        Object.entries(files).map(([file, rules]) => [file, sorted(rules)]),
      ),
    ),
    totals: sorted(totals),
  };
}

export function regressions(current, baseline) {
  const grown = [];
  for (const [file, rules] of Object.entries(current.files)) {
    for (const [rule, after] of Object.entries(rules)) {
      const before = baseline.files[file]?.[rule] ?? 0;
      if (after > before)
        grown.push(`${file} [${rule}]: ${before} -> ${after}`);
    }
  }
  return grown;
}

export function checkBaseline(current, baseline) {
  if (!baseline)
    throw new Error('Missing Hooks baseline; restore the reviewed baseline.');
  const grown = regressions(current, baseline);
  if (grown.length)
    throw new Error(`New Hooks diagnostics:\n${grown.join('\n')}`);
}

export function validateScan(results) {
  if (!results.length)
    throw new Error('Hooks scan is empty; check runtime source patterns.');
  for (const result of results) {
    for (const message of result.messages) {
      if (
        message.fatal ||
        message.severity === 2 ||
        !message.ruleId ||
        !message.ruleId.startsWith('react-hooks/')
      )
        throw new Error(
          `${result.filePath}:${message.line ?? 0}: ${message.message}`,
        );
    }
  }
}

export async function lintRuntime({
  cwd = root,
  patterns = runtimePatterns,
} = {}) {
  const eslint = new ESLint({
    cwd,
    overrideConfigFile: resolve(root, 'eslint.hooks.config.mjs'),
  });
  const results = await eslint.lintFiles(patterns);
  validateScan(results);
  const strict = new ESLint({
    cwd,
    overrideConfigFile: true,
    overrideConfig: strictHooksConfig,
    allowInlineConfig: false,
  });
  const adopters = results.filter((result) =>
    usesEffectEvent(readFileSync(result.filePath, 'utf8')),
  );
  if (adopters.length) {
    const strictResults = await strict.lintFiles(
      adopters.map((result) => result.filePath),
    );
    const failures = strictResults.flatMap((result) =>
      result.messages.map(
        (message) =>
          `${relative(cwd, result.filePath)}:${message.line ?? 0} [${message.ruleId ?? 'parse-error'}] ${message.message}`,
      ),
    );
    if (failures.length)
      throw new Error(
        `Strict Effect Event lint failed:\n${failures.join('\n')}`,
      );
  }
  return results;
}

export async function runDiagnostics({ formOnly = false } = {}) {
  const args = new Set(process.argv.slice(2));
  const results = await lintRuntime({
    patterns: formOnly ? formPatterns : runtimePatterns,
  });
  validateScan(results);
  const messages = results.flatMap((result) =>
    result.messages.map((message) => ({
      file: relative(root, result.filePath).replaceAll('\\', '/'),
      line: message.line,
      rule: message.ruleId,
      message: message.message,
    })),
  );
  const report = {
    tooling: Object.fromEntries(
      ['eslint', 'eslint-plugin-react-hooks', '@typescript-eslint/parser'].map(
        (name) => [name, require(`${name}/package.json`).version],
      ),
    ),
    filesLinted: results.length,
    ...aggregate(messages),
  };
  let baseline;
  try {
    baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (baseline && formOnly) {
    const messages = Object.entries(baseline.files)
      .filter(([file]) => isFormFile(file))
      .flatMap(([file, rules]) =>
        Object.entries(rules).flatMap(([rule, count]) =>
          Array.from({ length: count }, () => ({ file, rule })),
        ),
      );
    baseline = { ...baseline, ...aggregate(messages) };
  }
  if (args.has('--check') || args.has('--update'))
    checkBaseline(report, baseline);
  if (args.has('--update')) {
    if (formOnly)
      throw new Error(
        'Update the canonical baseline with diagnostics:hooks --update.',
      );
    const prettier = await import('prettier');
    writeFileSync(
      baselinePath,
      await prettier.format(JSON.stringify(report), {
        ...(await prettier.resolveConfig(baselinePath)),
        filepath: baselinePath,
      }),
    );
  }
  if (args.has('--json'))
    console.log(JSON.stringify({ ...report, messages }, null, 2));
  else {
    console.log(
      `${formOnly ? 'Form surface' : 'Runtime source'}: ${report.filesLinted} files, ${messages.length} Hooks diagnostics.`,
    );
    for (const [rule, count] of Object.entries(report.totals))
      console.log(
        `${rule}: ${count} (baseline ${baseline?.totals[rule] ?? 'new'})`,
      );
    if (args.has('--verbose'))
      for (const message of messages)
        console.log(
          `${message.file}:${message.line} [${message.rule}] ${message.message}`,
        );
    if (args.has('--check'))
      console.log('No new diagnostics; strict Effect Event lint passed.');
    if (args.has('--update')) console.log('Canonical Hooks baseline updated.');
  }
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
)
  await runDiagnostics();

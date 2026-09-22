import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { checkReport, compileReact, isLibrarySource } from './transform.mjs';

const root = resolve(import.meta.dirname, '../..');
const baselinePath = resolve(import.meta.dirname, 'baseline.json');
const update = process.argv.includes('--update');
const baseline = update ? {} : JSON.parse(readFileSync(baselinePath, 'utf8'));
const next = {};
let compiled = 0;
let diagnostics = 0;
for (const entry of readdirSync(resolve(root, 'src'), {
  recursive: true,
}).sort()) {
  const file = `src/${entry}`;
  const absolute = resolve(root, file);
  if (!isLibrarySource(absolute)) continue;
  const { report } = compileReact(readFileSync(absolute, 'utf8'), absolute);
  if (!update) checkReport(file, report, baseline);
  compiled += report.compiled.length;
  diagnostics += Object.values(report.diagnostics).reduce((a, b) => a + b, 0);
  if (
    report.compiled.length ||
    report.optOuts ||
    Object.keys(report.diagnostics).length
  ) {
    next[file] = {
      compiled: report.compiled.length,
      diagnostics: report.diagnostics,
      optOuts: report.optOuts,
    };
  }
}
if (update) writeFileSync(baselinePath, JSON.stringify(next, null, 2) + '\n');
console.log(
  `React Compiler: ${compiled} compiled functions, ${diagnostics} diagnostics${update ? ' (baseline updated)' : ''}.`,
);

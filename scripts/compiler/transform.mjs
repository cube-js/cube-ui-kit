import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

import { transformSync } from '@babel/core';
import compiler from 'babel-plugin-react-compiler';

const root = resolve(import.meta.dirname, '../..');
const baselinePath = resolve(import.meta.dirname, 'baseline.json');

export function isLibrarySource(id) {
  const file = relative(root, id).replaceAll('\\', '/');
  return (
    file.startsWith('src/') &&
    /\.[jt]sx?$/.test(file) &&
    !/(\.test[.-]|\.stories\.|\.fixture\.|\.d\.ts$|\/test\/|\/stories\/|\/legacy-contract\/)/.test(
      file,
    )
  );
}

export function compileReact(source, id) {
  const report = { compiled: [], diagnostics: {}, optOuts: 0, details: [] };
  const result = transformSync(source, {
    filename: id,
    babelrc: false,
    configFile: false,
    parserOpts: { plugins: ['typescript', 'jsx'] },
    plugins: [
      [
        compiler,
        {
          target: '18',
          // Known diagnostics bail out of that function only. The ratchet below
          // rejects new diagnostics instead of silently reducing our coverage.
          panicThreshold: 'none',
          logger: {
            logEvent(_file, event) {
              if (event.kind === 'CompileSuccess') {
                report.compiled.push(event.fnName ?? '<anonymous>');
              } else if (event.kind === 'CompileError') {
                const category =
                  event.detail.category ??
                  event.detail.options?.category ??
                  'Unknown';
                report.diagnostics[category] =
                  (report.diagnostics[category] ?? 0) + 1;
                report.details.push({
                  category,
                  line: event.fnLoc?.start.line ?? null,
                  reason:
                    event.detail.reason ??
                    event.detail.options?.reason ??
                    'Unknown diagnostic',
                });
              } else if (event.kind === 'CompileSkip') {
                report.optOuts++;
              } else if (event.kind === 'PipelineError') {
                throw new Error(event.data);
              }
            },
          },
        },
      ],
    ],
    sourceMaps: true,
  });
  return { code: result?.code ?? source, map: result?.map, report };
}

export function checkReport(file, report, baseline) {
  const expected = baseline[file] ?? {
    compiled: 0,
    diagnostics: {},
    optOuts: 0,
  };
  for (const [category, count] of Object.entries(report.diagnostics)) {
    if (count > (expected.diagnostics[category] ?? 0)) {
      throw new Error(
        `React Compiler: new ${category} diagnostic in ${file}: ${report.details
          .filter((detail) => detail.category === category)
          .map((detail) => `line ${detail.line}: ${detail.reason}`)
          .join('; ')}. Fix it or review the compiler baseline explicitly.`,
      );
    }
  }
  if (
    report.compiled.length < expected.compiled ||
    report.optOuts > expected.optOuts
  ) {
    throw new Error(
      `React Compiler: compilation coverage decreased in ${file}. Review scripts/compiler/baseline.json.`,
    );
  }
}

export function reactCompilerPlugin() {
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  const reports = {};
  return {
    name: 'uikit-react-compiler',
    enforce: 'pre',
    transform: {
      order: 'pre',
      handler(source, id) {
        if (!isLibrarySource(id)) return;
        const file = relative(root, id).replaceAll('\\', '/');
        const { report, ...result } = compileReact(source, id);
        checkReport(file, report, baseline);
        reports[file] = report;
        return result;
      },
    },
    generateBundle() {
      const sorted = Object.fromEntries(
        Object.entries(reports).sort(([a], [b]) => a.localeCompare(b)),
      );
      // Not published: package.json's files list only includes JS, maps and types.
      this.emitFile({
        type: 'asset',
        fileName: 'react-compiler-report.json',
        source: JSON.stringify(sorted, null, 2) + '\n',
      });
      const values = Object.values(reports);
      const count = values.reduce((sum, r) => sum + r.compiled.length, 0);
      const diagnostics = values.reduce(
        (sum, r) =>
          sum + Object.values(r.diagnostics).reduce((a, b) => a + b, 0),
        0,
      );
      console.log(
        `React Compiler: ${count} compiled functions, ${diagnostics} known diagnostics. See react-compiler-report.json.`,
      );
    },
  };
}

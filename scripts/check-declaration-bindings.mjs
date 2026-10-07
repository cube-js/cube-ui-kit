import { resolve, sep } from 'node:path';

import ts from 'typescript';

// Consumer fixtures use skipLibCheck because unrelated dependency declarations
// have existing errors. Still reject unresolved names in our emitted package:
// declaration emit can otherwise leak a generic parameter into public props.
const configPath = resolve('tsconfig.consumer.json');
const config = ts.readConfigFile(configPath, ts.sys.readFile);
if (config.error)
  throw new Error(
    ts.flattenDiagnosticMessageText(config.error.messageText, '\n'),
  );
const parsed = ts.parseJsonConfigFileContent(
  config.config,
  ts.sys,
  process.cwd(),
);
const program = ts.createProgram(parsed.fileNames, {
  ...parsed.options,
  skipLibCheck: false,
});
const dist = resolve('dist') + sep;
const unresolvedNameCodes = new Set([2304, 2503, 2552]);
const diagnostics = program
  .getSemanticDiagnostics()
  .filter(
    (diagnostic) =>
      diagnostic.file &&
      resolve(diagnostic.file.fileName).startsWith(dist) &&
      unresolvedNameCodes.has(diagnostic.code),
  );
if (diagnostics.length) {
  console.error(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (file) => file,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => '\n',
    }),
  );
  process.exitCode = 1;
} else {
  console.log('Built declarations contain no unresolved type names.');
}

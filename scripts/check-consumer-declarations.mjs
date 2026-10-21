import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

import ts from 'typescript';

// `pnpm check:consumer-declarations`, after `pnpm pack:test`: a consumer that
// exports `tasty(Component, …)` for one of our components must be able to emit
// declarations for it. Its inferred type carries the component's props and
// statics, so every type they name has to be reachable through our `exports`.
const packed = resolve('.cache/compiler-package/package');
const root = resolve('.cache/consumer-declarations');
const installed = resolve(root, 'node_modules/@cube-dev/ui-kit');
const tsc = resolve('node_modules/typescript-native/bin/tsc');

if (existsSync(resolve(packed, 'dist/node_modules'))) {
  console.error(
    'The package bundles dist/node_modules: a declaration names a dependency the package does not declare.',
  );
  process.exit(1);
}

// Installed under node_modules, as in an app, so TypeScript can name our types
// only through `exports`. The consumer's own package.json keeps our package
// scope from resolving `@cube-dev/ui-kit` to this repo.
rmSync(root, { recursive: true, force: true });
cpSync(packed, installed, { recursive: true });
writeFileSync(
  resolve(root, 'package.json'),
  JSON.stringify({ name: 'consumer', private: true, type: 'module' }),
);
// Tasty's declarations import csstype. An app hoists it next to Tasty, where
// a declaration can name it; ui-kit's pnpm layout nests it, so link it here.
const tasty = realpathSync(resolve('node_modules/@tenphi/tasty'));
symlinkSync(
  dirname(
    createRequire(resolve(tasty, 'package.json')).resolve(
      'csstype/package.json',
    ),
  ),
  resolve(root, 'node_modules/csstype'),
  'dir',
);

const index = ts.createSourceFile(
  'index.d.ts',
  ts.sys.readFile(resolve(installed, 'dist/index.d.ts')),
  ts.ScriptTarget.Latest,
);
// A component we re-export from a dependency (react-i18next's `Trans`) carries
// that dependency's types, which this check cannot fix.
const dependencyBindings = new Set();
const names = [];
index.forEachChild((node) => {
  if (
    ts.isImportDeclaration(node) &&
    !node.moduleSpecifier.text.startsWith('.')
  ) {
    for (const element of node.importClause?.namedBindings?.elements ?? []) {
      dependencyBindings.add(element.name.text);
    }
  }
  if (!ts.isExportDeclaration(node) || node.isTypeOnly) return;
  for (const element of node.exportClause?.elements ?? []) {
    const local = (element.propertyName ?? element.name).text;
    if (
      !element.isTypeOnly &&
      /^[A-Z][a-z\d]/.test(element.name.text) &&
      !dependencyBindings.has(local)
    ) {
      names.push(element.name.text);
    }
  }
});
if (!names.length) {
  throw new Error('Found no components in dist/index.d.ts.');
}

const header = [
  // With `types: []`, only a reference resolves csstype through the link.
  '/// <reference types="csstype" />',
  "import { tasty } from '@tenphi/tasty';",
  `import { ${names.join(', ')} } from '@cube-dev/ui-kit';`,
];
writeFileSync(
  resolve(root, 'extensions.tsx'),
  [
    ...header,
    ...names.map(
      (name) => `export const ${name}Extension = tasty(${name}, {});`,
    ),
  ].join('\n'),
);

// Returns each diagnostic with the name its line extends. One on the header
// (an import that does not resolve) or outside the fixture fails the check.
function compile(declaration) {
  writeFileSync(
    resolve(root, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'es2022',
        module: 'esnext',
        moduleResolution: 'bundler',
        lib: ['dom', 'es2023'],
        jsx: 'react-jsx',
        strict: true,
        skipLibCheck: true,
        types: [],
        rootDir: '.',
        outDir: 'out',
        ...(declaration
          ? { declaration: true, emitDeclarationOnly: true }
          : { noEmit: true }),
      },
      files: ['extensions.tsx'],
    }),
  );
  const { stdout, stderr, status } = spawnSync(
    process.execPath,
    [tsc, '-p', '.', '--pretty', 'false'],
    { cwd: root, encoding: 'utf8' },
  );
  const diagnostics = stdout
    .split(/\n(?=\S)/)
    .filter((text) => text.trim())
    .map((text) => {
      const line = /^extensions\.tsx\((\d+),/.exec(text)?.[1];
      return { text: text.trimEnd(), name: names[line - 1 - header.length] };
    });
  const unexpected = diagnostics.filter(({ name }) => name === undefined);
  if (unexpected.length || (status !== 0 && !diagnostics.length)) {
    throw new Error(
      `tsc failed outside the extensions:\n${unexpected.map(({ text }) => text).join('\n') || stdout + stderr}`,
    );
  }
  return diagnostics;
}

// The bundle re-exports some types without a `type` marker (TS2693 when used as
// a value). Any other name `tasty()` rejects must be listed here, so that a
// component which stops working as a base fails instead of dropping out.
const knownNotBases = new Set(['ResizeSensor']);
const compoundComponents = [
  'Layout',
  'GridLayout',
  'Text',
  'Form',
  'Tabs',
  'ItemTable',
  'Notification',
];
const notBases = new Set();
const rejected = [];
for (const diagnostic of compile(false)) {
  if (/ error TS2693:/.test(diagnostic.text)) {
    notBases.add(diagnostic.name);
  } else if (knownNotBases.has(diagnostic.name)) {
    notBases.add(diagnostic.name);
  } else {
    rejected.push(diagnostic);
  }
}
const unchecked = compoundComponents.filter(
  (name) => !names.includes(name) || notBases.has(name),
);
const failures = [
  ...rejected,
  ...compile(true).filter(({ name }) => !notBases.has(name)),
  ...unchecked.map((name) => ({ text: `${name} is not checked.` })),
];

if (failures.length) {
  console.error(failures.map(({ text }) => text).join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `A consumer emits declarations for tasty() extensions of ${names.length - notBases.size} components.`,
  );
}

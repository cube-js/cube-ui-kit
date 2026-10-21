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

// Under node_modules, TypeScript names the package's types only through its
// `exports`, as in an app. Outside it, a relative path to any dist file would
// do, and so would our own package scope, where the name resolves to this repo.
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
      /^[A-Z][a-z]/.test(element.name.text) &&
      !dependencyBindings.has(local)
    ) {
      names.push(element.name.text);
    }
  }
});

const header = [
  // Resolving csstype through the link is what lets TypeScript name it.
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

// Returns each diagnostic in the fixture with the name its line extends.
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
  if (status !== 0 && !stdout.includes('extensions.tsx(')) {
    throw new Error(`tsc failed outside the fixture:\n${stdout}${stderr}`);
  }
  return stdout
    .split(/\n(?=\S)/)
    .filter((text) => text.startsWith('extensions.tsx('))
    .map((text) => ({
      text: text.trimEnd(),
      name: names[
        Number(/^extensions\.tsx\((\d+),/.exec(text)[1]) - 1 - header.length
      ],
    }));
}

// A name `tasty()` rejects as a base (a context, a provider with required
// children, a hook) is not a component this check is about.
const notBases = new Set(compile(false).map(({ name }) => name));
const failures = compile(true).filter(({ name }) => !notBases.has(name));

if (failures.length) {
  console.error(failures.map(({ text }) => text).join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `A consumer emits declarations for tasty() extensions of ${names.length - notBases.size} components.`,
  );
}

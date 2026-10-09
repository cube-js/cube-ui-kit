import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseSync, traverse } from '@babel/core';

export function moduleSpecifiers(source) {
  const ast = parseSync(source, {
    babelrc: false,
    configFile: false,
    sourceType: 'module',
    parserOpts: { plugins: ['typescript', 'jsx'] },
  });
  const imports = [];
  traverse(ast, {
    enter({ node }) {
      if (
        (node.type.startsWith('Import') || node.type.startsWith('Export')) &&
        node.source?.type === 'StringLiteral'
      )
        imports.push(node.source.value);
      if (
        node.type === 'CallExpression' &&
        (node.callee.type === 'Import' || node.callee.name === 'require') &&
        node.arguments[0]?.type === 'StringLiteral'
      )
        imports.push(node.arguments[0].value);
    },
  });
  return imports;
}

export function checkReactPackage(
  packageRoot,
  { dist = resolve(packageRoot, 'dist'), compiled = true } = {},
) {
  const pkg = JSON.parse(
    readFileSync(resolve(packageRoot, 'package.json'), 'utf8'),
  );
  for (const name of ['react', 'react-dom'])
    assert.equal(
      pkg.peerDependencies[name],
      '^19.3.0',
      `${name} consumer minimum`,
    );
  for (const section of ['dependencies', 'devDependencies']) {
    for (const name of [
      'react-compiler-runtime',
      'react-test-renderer',
      '@types/react-test-renderer',
      'react-is',
      '@types/react-is',
    ])
      assert.equal(
        pkg[section]?.[name],
        undefined,
        `${section}.${name} must be removed`,
      );
  }
  const files = readdirSync(dist, { recursive: true }).filter((file) =>
    file.endsWith('.js'),
  );
  assert(files.length > 0, 'Package JavaScript is missing');
  for (const file of files) {
    const imports = moduleSpecifiers(readFileSync(resolve(dist, file), 'utf8'));
    assert(
      !imports.includes('react-compiler-runtime'),
      `${file}: compatibility runtime import`,
    );
    assert(
      !imports.some((name) => name.includes('/src/')),
      `${file}: internal source import`,
    );
    if (!compiled)
      assert(
        !imports.includes('react/compiler-runtime'),
        `${file}: uncompiled output contains compiler runtime`,
      );
    if (/^(eslint-plugin|probe)\//.test(file))
      assert(
        !imports.some((name) => /^react(?:\/|$)/.test(name)),
        `${file}: non-React entry imports React`,
      );
  }
  for (const file of [
    'components/form/Form/ModernFormRoot.js',
    'components/form/Form/modern/react.js',
    'components/fields/TextInput/TextInput.js',
    'components/overlays/Dialog/ModernDialogForm.js',
  ])
    assert.equal(
      moduleSpecifiers(readFileSync(resolve(dist, file), 'utf8')).includes(
        'react/compiler-runtime',
      ),
      compiled,
      `${file}: expected compilation mode`,
    );
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  checkReactPackage(resolve(import.meta.dirname, '../..'));
  console.log('React 19.3 peers and native compiler package output verified.');
}

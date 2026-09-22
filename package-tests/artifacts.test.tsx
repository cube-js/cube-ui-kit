import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const uncompiled = process.env.UIKIT_TEST_UNCOMPILED === '1';
const packageRoot = resolve('.cache/compiler-package/package');
const dist = uncompiled
  ? resolve('dist-uncompiled')
  : resolve(packageRoot, 'dist');

it('ships a production runtime dependency compatible with both supported React majors', () => {
  const pkg = JSON.parse(
    readFileSync(resolve(packageRoot, 'package.json'), 'utf8'),
  );
  expect(pkg.dependencies['react-compiler-runtime']).toBe('1.0.0');
  expect(pkg.devDependencies['react-compiler-runtime']).toBeUndefined();
  expect(pkg.peerDependencies.react).toBe('^18.0.0 || ^19.0.0');
});

it('ships optimized modern forms and inputs through the React 18 runtime', () => {
  for (const file of [
    'components/form/Form/ModernFormRoot.js',
    'components/form/Form/modern/react.js',
    'components/fields/TextInput/TextInput.js',
    'components/overlays/Dialog/ModernDialogForm.js',
  ]) {
    const source = readFileSync(resolve(dist, file), 'utf8');
    expect(source.includes('react-compiler-runtime'), file).toBe(!uncompiled);
  }
  for (const file of readdirSync(dist, { recursive: true }).filter((file) =>
    file.endsWith('.js'),
  )) {
    const source = readFileSync(resolve(dist, file), 'utf8');
    expect(source, file).not.toMatch(/from ["']react\/compiler-runtime["']/);
    expect(source, file).not.toMatch(/from ["'][^"']*\/src\//);
  }
});

it('keeps the non-React entry points free of compiler runtime imports', () => {
  for (const entry of ['eslint-plugin', 'probe']) {
    for (const file of readdirSync(resolve(dist, entry), {
      recursive: true,
    }).filter((file) => file.endsWith('.js'))) {
      expect(readFileSync(resolve(dist, entry, file), 'utf8')).not.toContain(
        'react-compiler-runtime',
      );
    }
  }
});

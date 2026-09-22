import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const directory = resolve('.cache/compiler-package');
mkdirSync(directory, { recursive: true });
// Exercise the same prepack/postpack lifecycle as publishing, then resolve
// consumer imports from the extracted tarball, never from src/.
execFileSync('pnpm', ['pack', '--out', `${directory}/ui-kit.tgz`], {
  stdio: 'inherit',
});
rmSync(`${directory}/package`, { recursive: true, force: true });
execFileSync('tar', ['-xzf', `${directory}/ui-kit.tgz`, '-C', directory]);

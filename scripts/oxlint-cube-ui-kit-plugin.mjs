/**
 * Loads the shipped ESLint plugin from `src/` so `pnpm lint` dogfoods
 * `no-redundant-default-prop` against the very source the package publishes.
 *
 * The indirection is not decoration. Oxlint's `jsPlugins` loader is a bare
 * `(await import(url)).default`, so pointing it at `src/eslint-plugin/index.ts`
 * fails: Node's TypeScript type-stripping keeps Node's ESM resolver, which will
 * not resolve the extensionless relative imports the source uses. Jiti resolves
 * them. Pointing oxlint at `dist/` instead would work but couples linting to a
 * prior build — `dist` is gitignored and CI lints without building first.
 */
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url);

export default await jiti.import('../src/eslint-plugin/index.ts', {
  default: true,
});

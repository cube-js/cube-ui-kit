import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { precompileTastyStyles } from '@tenphi/tasty/precompile';
import { createElement } from 'react';

import { Root } from '../components/Root';

import type {
  TastyPrecompileCase,
  TastyPrecompileResult,
} from '@tenphi/tasty/precompile';
import type { CubeRootProps } from '../components/Root';

export type PrecompileCase = TastyPrecompileCase;

export interface PrecompileStylesOptions {
  id: string;
  cases: readonly PrecompileCase[];
  /**
   * Props for the UI Kit Root wrapped around every case. Pass false when each
   * case already returns the application's complete Root tree.
   */
  root?: false | Omit<CubeRootProps, 'children'>;
  /**
   * Re-render UI Kit's own component catalog under this application's Tasty
   * configuration and fold it into the artifact. Defaults to `true`.
   *
   * A chunk's lookup key hashes the style source, not the CSS it produced, so a
   * kit chunk compiled under UI Kit's configuration keeps the same key under an
   * application that redefines a unit, recipe or handler the chunk relies on —
   * while the CSS behind that key no longer matches. Recompiling here removes
   * the divergence instead of leaving Tasty to detect it and fall back.
   *
   * Set to `false` only when this application makes no compilation-affecting
   * configuration change, and pair it with the shipped artifact:
   *
   * ```ts
   * import '@cube-dev/ui-kit/precompiled-styles';
   * ```
   *
   * The two register side by side — catalogs stack, and identical chunks
   * compile to identical class names, so the overlap is free. Skipping the
   * recompilation is a build-time saving, not a way to drop kit coverage.
   */
  recompileKitCatalog?: boolean;
}

/**
 * UI Kit's own catalog cases.
 *
 * Loaded from the package rather than imported statically so that an
 * application that opts out of recompiling them never pays for evaluating the
 * component matrix. The path is the same two levels below the package root from
 * `src/` and from `dist/`, so it resolves in this repo and once published.
 */
function kitCatalogURL(): string {
  // Resolved through `path` rather than `new URL(..., import.meta.url)`:
  // bundlers rewrite that exact pattern into a served asset URL, and Node's
  // ESM loader accepts only `file:` and `data:`. The catalog sits two levels
  // below the package root from both `src/` and `dist/`.
  const here = dirname(fileURLToPath(import.meta.url));

  return pathToFileURL(
    resolve(here, '../../scripts/precompile-tasty-catalog.mjs'),
  ).href;
}

async function loadKitCatalogCases(): Promise<readonly PrecompileCase[]> {
  try {
    const module = (await import(/* @vite-ignore */ kitCatalogURL())) as {
      cases: readonly PrecompileCase[];
    };

    return module.cases;
  } catch (error) {
    throw new Error(
      `[UI Kit] Could not load UI Kit's precompile catalog from ${kitCatalogURL()}. Pass recompileKitCatalog: false and register '@cube-dev/ui-kit/precompiled-styles' alongside this artifact instead.`,
      { cause: error },
    );
  }
}

/**
 * Compile application-owned catalog cases under UI Kit's exact Tasty
 * configuration and normal Root providers.
 */
export async function precompileStyles(
  options: PrecompileStylesOptions,
): Promise<TastyPrecompileResult> {
  const { id, cases, root = {}, recompileKitCatalog = true } = options;

  // UI Kit's cases carry their own providers and are rendered exactly as
  // `pnpm precompile:tasty` renders them, so an application that changes
  // nothing compilation-affecting reproduces the shipped chunks byte for byte.
  const kitCases = recompileKitCatalog ? await loadKitCatalogCases() : [];

  const appCases = cases.map((item) => ({
    id: item.id,
    async render() {
      const tree = await item.render();

      return root === false ? tree : createElement(Root, root, tree);
    },
  }));

  return precompileTastyStyles({ id, cases: [...kitCases, ...appCases] });
}

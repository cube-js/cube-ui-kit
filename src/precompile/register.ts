/**
 * Runtime registration for an application-owned catalog.
 *
 * `@cube-dev/ui-kit/precompile` compiles a catalog and is Node-only; this is
 * the browser half, so that an application never has to depend on
 * `@tenphi/tasty` directly to use one. Reaching past UI Kit for it risks a
 * second Tasty instance with its own registry, which would leave the catalog
 * registered against a store nothing reads.
 *
 * A separate entry rather than a re-export from the package root: the registry
 * and its configuration comparison ship with whoever imports this, and an
 * application that does not build a catalog should not carry them.
 *
 * `@cube-dev/ui-kit/precompiled-styles` is the other, narrower door — it
 * registers UI Kit's own prebuilt artifact and takes no arguments.
 */
export {
  installTastyPrecompiled,
  registerTastyPrecompiled,
} from '@tenphi/tasty/precompile/register';

// `TastyCompilationConfig` is deliberately absent: Tasty does not export it
// from this entry yet. `TastyPrecompiledManifest` references it structurally,
// so typing a manifest works without it.
export type {
  PrecompiledCounterStyleCacheEntry,
  PrecompiledKeyframeCacheEntry,
  PrecompiledPropertyCacheEntry,
  TastyPrecompiledChunk,
  TastyPrecompiledDependencies,
  TastyPrecompiledManifest,
  TastyPrecompiledStats,
} from '@tenphi/tasty/precompile/register';

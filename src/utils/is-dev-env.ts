/**
 * `NODE_ENV` as the environment that is actually running reports it, or
 * `undefined` when nothing can say.
 *
 * The one place in ui-kit allowed to read `NODE_ENV`, because it is the one
 * place that has to survive the build unfolded. A comparison compiled into
 * `dist` freezes whatever `NODE_ENV` the release machine exported and hands
 * every consumer the same answer, so `tsdown.config.ts` defines the expression
 * as itself to stop rolldown inlining it - see the comment there.
 */
function readNodeEnv(): string | undefined {
  try {
    // Deliberately unguarded by `typeof process`: a guard would also gate the
    // *substituted* value, and browser bundlers replace this read without
    // defining `process` itself - so `typeof process === 'undefined'` is true
    // in a Vite dev build that just told us NODE_ENV is "development". The
    // catch covers the case the guard was there for: no substitution and no
    // `process` to dereference, e.g. an unbundled `<script type="module">`.
    return process.env.NODE_ENV;
  } catch {
    return undefined;
  }
}

/**
 * `localStorage.UIKIT_DEBUG` as a tri-state: an explicit `"true"` forces ui-kit's
 * diagnostics on and an explicit `"false"` forces them off, in any environment.
 *
 * The escape hatch in both directions. Consumers whose production build somehow
 * resolves to development can silence us without waiting for a release, and
 * anyone debugging a built app can switch us back on.
 */
function readDebugFlag(): boolean | undefined {
  if (typeof window === 'undefined' || !window.localStorage) return undefined;

  try {
    const flag = window.localStorage.getItem('UIKIT_DEBUG')?.toLowerCase();

    if (flag === 'true') return true;
    if (flag === 'false') return false;
  } catch {
    // localStorage might not be available (private browsing, etc.)
  }

  return undefined;
}

/**
 * Whether to run diagnostics that only a human looking at the page can act on -
 * a warning drawn into the layout, a complaint about a measurement.
 *
 * Off under `test`: jsdom reports `offsetHeight: 0` for everything, so anything
 * keyed off a measurement is not just noisy in a consumer's test run but wrong.
 * Off under `production`, and off when nobody could say what `NODE_ENV` is -
 * a diagnostic shown to end users is worse than a missing one shown to a
 * developer, who still has `UIKIT_DEBUG`.
 *
 * Use {@link isDevEnvOrTest} instead for diagnostics a test run should surface.
 */
export function isDevEnv(): boolean {
  const flag = readDebugFlag();

  if (flag !== undefined) return flag;

  const nodeEnv = readNodeEnv();

  if (nodeEnv === undefined) return false;

  return nodeEnv !== 'test' && nodeEnv !== 'production';
}

/**
 * Like {@link isDevEnv}, but on under `test` as well.
 *
 * For diagnostics a consumer's test run should still surface - deprecation
 * warnings above all. "You are passing a prop we are about to remove" is worth
 * hearing from CI, and unlike a collapsed-height complaint it cannot be wrong
 * just because jsdom has no layout.
 */
export function isDevEnvOrTest(): boolean {
  const flag = readDebugFlag();

  if (flag !== undefined) return flag;

  const nodeEnv = readNodeEnv();

  if (nodeEnv === undefined) return false;

  return nodeEnv !== 'production';
}

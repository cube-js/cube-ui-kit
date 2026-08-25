/**
 * The check both probe tiers run before they answer anything.
 *
 * Shared rather than duplicated, and shared rather than jsdom-only: the browser
 * tier is the one people reach for precisely because they want to trust the
 * numbers, so a silent misconfiguration there is worse, not better. It would
 * report a confident `rgb(...)` and a real pixel geometry derived from units
 * that never resolved.
 */
import { getGlobalPredefinedStates, renderStyles } from '@tenphi/tasty';

/**
 * Fail loudly if the UI Kit's tasty config did not take effect.
 *
 * `src/components/Root.tsx` does two things in its module body that everything
 * downstream depends on: `setGlobalPredefinedStates()` registers the `@dark` /
 * `@hc` states, and `configure()` registers the units (`x`, `r`, `cr`, `bw`,
 * `ow`) and the `reset` / `button` / `input` recipes. `configure()` swaps the
 * global StyleInjector and becomes a silent no-op once any style has been
 * generated, so if something renders a tasty element before `<Root>`'s module
 * runs, units and recipes go unresolved AND rules injected into the first
 * injector become invisible to `getCSSTextForNode`.
 *
 * Both failures are silent and produce plausible-looking output. A probe that
 * reports confidently wrong CSS is worse than one that refuses to run.
 *
 * Both halves are checked because they fail independently:
 * `setGlobalPredefinedStates` always applies, while `configure()` is the call
 * that no-ops. The unit check is end-to-end on purpose — it asserts the thing
 * the probe promises (`1x` resolves to the gap token) rather than the mere
 * presence of a config key.
 */
export function assertConfigApplied(): void {
  const states = getGlobalPredefinedStates();

  if (!states || !('@dark' in states)) {
    throw new Error(
      'Probe harness: the `@dark` / `@hc` predefined states are missing, so ' +
        "`<Root>`'s module body did not run. Schema-keyed styles would resolve " +
        'wrong. Check what the harness imports before `components/Root`.',
    );
  }

  const [rule] = renderStyles({ padding: '1x' }, '.probe-config-check');

  if (!rule?.declarations.includes('var(--gap)')) {
    throw new Error(
      'Probe harness: the `x` unit did not resolve to `var(--gap)`, so tasty’s ' +
        '`configure()` ran too late or was a no-op. Every unit, recipe and preset ' +
        `in this run would be wrong. Got: ${rule?.declarations ?? '(no rule)'}`,
    );
  }
}

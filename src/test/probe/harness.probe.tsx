/**
 * The probe harness, run by `pnpm probe`.
 *
 * Named `*.probe.tsx` rather than `*.test.tsx` on purpose: vitest's default
 * `include` is `**\/*.{test,spec}.?(c|m)[jt]s?(x)` and it globs with `dot:
 * true`, so anything named like a spec — even under a dotted directory — is
 * collected by a plain `pnpm test`. This name cannot match, so the harness and
 * the snippet it imports stay invisible to the main suite without touching its
 * `exclude` list.
 *
 * The snippet is a plain module that this file imports dynamically. That is what
 * lets a syntax or type error in it arrive as a catchable rejection carrying
 * Vite's code frame, instead of failing module evaluation and dumping a vitest
 * stack trace.
 *
 * `../../components/Root` is imported for its module side effects as much as for
 * `<Root>` itself: its body calls tasty's `configure()` (units `x`/`r`/`cr`, the
 * `reset` / `button` / `input` recipes) and `setGlobalPredefinedStates()` (the
 * `@dark` / `@hc` states). `configure()` swaps the global StyleInjector and
 * turns into a silent no-op once any style has been generated — so if something
 * rendered a tasty element first, units and recipes would go unresolved AND
 * rules injected into the first injector would be invisible to
 * `getCSSTextForNode`. Both failures are silent and produce plausible-looking
 * output, so `assertConfigApplied()` — shared with the browser tier — checks at
 * runtime before any work.
 */
import { getCSSText, renderStyles } from '@tenphi/tasty';
import { render } from '@testing-library/react';
import { type ComponentType } from 'react';
import { expect, it } from 'vitest';

import { Root } from '../../components/Root';
import { canonicalize, captureCss, diffRules, splitRules } from '../../probe';
import { renderColorTokens } from '../../tokens/colors';
import { getPaletteTokens } from '../../tokens/palette';

import { assertConfigApplied } from './config-guard';
import { readInput, writeResult } from './io';

it('probe', async () => {
  assertConfigApplied();

  const input = readInput();
  const warnings: string[] = [];

  // Pass 1: the empty harness. Everything `<Root>` declares — the `:root` token
  // block, the global styles, every component the provider stack mounts — lands
  // here, and is what we subtract from pass 2.
  const view = render(<Root>{null}</Root>);
  const baseline = captureCss(view.baseElement);

  warnings.push(...baseline.warnings);

  if (input.mode === 'styles') {
    writeResult(input, {
      mode: 'styles',
      styles: renderStyles(input.styles, '.probe-target'),
      warnings,
    });

    return;
  }

  if (input.mode === 'tokens') {
    writeResult(input, {
      mode: 'tokens',
      schema: `${input.tokenOptions?.schema ?? 'light'}${
        input.tokenOptions?.highContrast ? ' + high contrast' : ''
      }`,
      // Flat literal values for one variant. The legacy aliases come back BY
      // REFERENCE here (`'#dark': '#surface-text'`) — deliberately, so a region
      // preview re-resolves them against its own tokens — so they are reported
      // separately rather than being mistaken for resolved colors.
      resolved: renderColorTokens(input.tokenOptions),
      // The same palette as tasty state maps keyed by schema
      // (`'' | '@dark' | '@hc' | '@dark & @hc'`), which is the four-variant view
      // a palette change has to be diffed across. A different shape from the
      // above, so it is labelled rather than merged.
      palette: getPaletteTokens(),
      warnings,
    });

    return;
  }

  if (input.mode === 'globals') {
    // `getCSSText()`, not the `getCSSTextForNode` baseline above — and this is
    // where the UI Kit differs from Cube Cloud's probe. Console-ui hands the
    // palette to its Root through a tasty `tokens` prop, so the token block is
    // attributed to that node and a per-node dump carries all ~119KB of it.
    // Here `GlobalStyles` injects it through `useGlobalStyles` / `injectRawCSS`
    // instead, so it lives on a global sheet that no per-node dump can see. A
    // node-scoped answer would report three rules and look like `<Root>` barely
    // styles anything.
    const global = getCSSText();

    writeResult(input, {
      mode: 'globals',
      css: global,
      ruleCount: splitRules(global).length,
      // The node-attributed subset, which is all `render` has to subtract. The
      // rest of the block above is global, so it never enters a per-node dump
      // and `render` never sees it in the first place.
      subtractedRuleCount: splitRules(baseline.text).length,
      warnings,
    });

    return;
  }

  // `render` mode. Import the snippet only now, so a compile error in it
  // surfaces as a rejection we can shape rather than a module-load crash.
  let Snippet: ComponentType;

  try {
    // Non-literal specifier on purpose. The snippet does not exist in a fresh
    // checkout, so a literal `import('../../../.probe/snippet')` would fail a
    // typecheck even though it resolves fine at runtime.
    const module = (await import(/* @vite-ignore */ input.snippetPath!)) as {
      default: ComponentType;
    };

    Snippet = module.default;
  } catch (error) {
    writeResult(input, {
      mode: 'render',
      ok: false,
      kind: 'compile',
      message: error instanceof Error ? error.message : String(error),
      warnings,
    });

    return;
  }

  // Which elements existed before the snippet mounted. Anything under the Root
  // that is new in pass 2 but outside the scope wrapper arrived through a portal
  // — that is where Dialog / Menu / Tooltip / Select popups land, since `<Root>`
  // is the `PortalProvider` target.
  const before = new Set(view.baseElement.querySelectorAll('*'));

  // Pass 2: rerender the SAME root rather than mounting a second one. A remount
  // would tear `<Root>` down and back up, and any rule the injector GC'd in
  // between would reappear in pass 2 looking like the snippet's own.
  //
  // `<Snippet />` — React renders the default export, rather than this harness
  // calling it and mounting what comes back. Calling it runs the body outside
  // React's render phase, so any hook in it throws "invalid hook call" —
  // including in the `export default function Snippet() { … }` form the CLI
  // documents. `useState` in a snippet is not exotic: it is what probing a
  // controlled input or a disclosure takes.
  //
  // A throw from here is a RENDER failure, not a compile one, so it is caught
  // separately. Reporting it as `compile` sent people looking for a syntax error
  // in code that had parsed perfectly well.
  try {
    view.rerender(
      <Root>
        <div data-probe-scope="">
          <Snippet />
        </div>
      </Root>,
    );
  } catch (error) {
    writeResult(input, {
      mode: 'render',
      ok: false,
      kind: 'render',
      message: error instanceof Error ? error.message : String(error),
      warnings,
    });

    return;
  }

  const full = captureCss(view.baseElement);

  warnings.push(...full.warnings);

  const scope = view.baseElement.querySelector('[data-probe-scope]');
  const html = (scope ?? view.baseElement).innerHTML;

  // Portaled roots: new, not inside the scope wrapper, and not nested inside
  // another node we are already reporting.
  const portals = [...view.baseElement.querySelectorAll('*')]
    .filter(
      (node) =>
        !before.has(node) &&
        !scope?.contains(node) &&
        node.parentElement != null &&
        (before.has(node.parentElement) ||
          node.parentElement === view.baseElement),
    )
    .map((node) => node.outerHTML);

  const css = input.fullCss
    ? full.text
    : diffRules(baseline.text, full.text).join('\n');

  writeResult(input, {
    mode: 'render',
    ok: true,
    html: input.canonical ? canonicalize(html) : html,
    // Reported separately rather than merged: reading `html` should not require
    // guessing which part rendered inline and which was portalled elsewhere.
    portalHtml: portals.map((markup) =>
      input.canonical ? canonicalize(markup) : markup,
    ),
    css: input.canonical ? canonicalize(css) : css,
    ruleCount: splitRules(css).length,
    warnings,
  });

  // Keeps the file honest as a vitest run: if the harness silently produced
  // nothing, this is the failure rather than an empty result file.
  //
  // Counts portals, not just inline markup. A portal-only snippet — Dialog,
  // Menu, Tooltip, a Select popup — renders zero inline chars by design, because
  // `<Root>` is the portal target and the markup lands beside the scope wrapper
  // rather than inside it. Asserting on `html` alone fails on exactly the
  // overlays this harness exists to make visible.
  expect(html.length + portals.join('').length).toBeGreaterThan(0);
});

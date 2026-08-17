/**
 * The browser-tier harness, run by `pnpm probe:browser`.
 *
 * This tier answers the four questions jsdom cannot:
 *
 *   - computed styles — jsdom returns the literal `var(--surface-2-color)` and
 *     an empty `--gap`, because it never resolves custom properties
 *   - layout and geometry — jsdom reports every element as zero-sized
 *   - pointer behaviour — drag, hover, pointer capture
 *   - screenshots
 *
 * Use whichever tier answers your question — probing is throwaway, so there is
 * no budget to protect here. `pnpm probe` is just the quicker default: an order
 * of magnitude faster and no browser binary.
 *
 * The "justify each file" rule belongs to the `*.browser.test.tsx` SPECS in
 * `vitest.browser.config.ts` — permanent artefacts someone maintains and
 * re-runs, where a probe run ends when you read it. It does not apply here.
 */
import { render } from '@testing-library/react';
import { type ReactElement } from 'react';
import { expect, it } from 'vitest';
import { commands, page } from 'vitest/browser';

import { Root } from '../../components/Root';
import { captureCss, diffRules, splitRules } from '../../probe';

import type { ProbeInput } from './io';

declare const __PROBE_INPUT__: string;

const input = JSON.parse(__PROBE_INPUT__) as ProbeInput & {
  computed?: string;
  computedProps?: string[];
  rect?: string;
  screenshot?: boolean;
  scheme?: 'light' | 'dark' | 'hc';
};

/**
 * Drive the scheme the way a host app does — through the attributes on `<html>`
 * that the `@dark` / `@hc` predefined states resolve against (see `Root.tsx`).
 * Setting a token by hand would prove nothing about how the real cascade
 * behaves.
 */
function applyScheme(scheme: string | undefined): void {
  const root = document.documentElement;

  if (scheme === 'dark') {
    root.setAttribute('data-schema', 'dark');
  }
  if (scheme === 'light') {
    root.setAttribute('data-schema', 'light');
  }
  if (scheme === 'hc') {
    root.setAttribute('data-contrast', 'high');
  }
}

it('probe:browser', async () => {
  applyScheme(input.scheme);

  const view = render(<Root>{null}</Root>);
  const baseline = captureCss(view.baseElement);

  let snippet: ReactElement;

  try {
    // `snippetUrl`, not `snippetPath` — see the field's note in `io.ts`.
    const module = (await import(/* @vite-ignore */ input.snippetUrl!)) as {
      default: () => ReactElement;
    };

    snippet = module.default();
  } catch (error) {
    await commands.writeFile(
      input.outPath,
      JSON.stringify({
        runId: input.runId,
        mode: 'render',
        tier: 'browser',
        ok: false,
        kind: 'compile',
        message: error instanceof Error ? error.message : String(error),
      }),
    );

    return;
  }

  // Which elements existed before the snippet mounted. Mirrors the jsdom tier:
  // `<Root>` is the `PortalProvider` target, so an overlay lands BESIDE the
  // scope wrapper rather than inside it. Without this the browser tier prints an
  // empty `=== HTML ===` for a Dialog / Menu / Tooltip, which reads as "it did
  // not render" — on the very tier you reach for to measure an overlay.
  const before = new Set(view.baseElement.querySelectorAll('*'));

  view.rerender(
    <Root>
      <div data-probe-scope="">{snippet}</div>
    </Root>,
  );

  const full = captureCss(view.baseElement);
  const scope = view.baseElement.querySelector('[data-probe-scope]');
  const css = input.fullCss
    ? full.text
    : diffRules(baseline.text, full.text).join('\n');

  const html = (scope ?? view.baseElement).innerHTML;

  const portalHtml = [...view.baseElement.querySelectorAll('*')]
    .filter(
      (node) =>
        !before.has(node) &&
        !scope?.contains(node) &&
        node.parentElement != null &&
        (before.has(node.parentElement) ||
          node.parentElement === view.baseElement),
    )
    .map((node) => node.outerHTML);

  // The whole point of this tier: real resolved values, not `var(...)` text.
  let computed: Record<string, string> | undefined;

  if (input.computed) {
    const target = document.querySelector(input.computed);

    if (!target) {
      throw new Error(
        `probe:browser --computed: no element matched "${input.computed}".`,
      );
    }

    const style = getComputedStyle(target);

    computed = Object.fromEntries(
      (input.computedProps?.length
        ? input.computedProps
        : ['backgroundColor', 'color', 'padding', 'fontSize', 'borderRadius']
      ).map((prop) => [
        prop,
        prop.startsWith('--')
          ? style.getPropertyValue(prop).trim()
          : String(style[prop as never] ?? ''),
      ]),
    );
  }

  let rect: DOMRect | undefined;

  if (input.rect) {
    const target = document.querySelector(input.rect);

    if (!target) {
      throw new Error(
        `probe:browser --rect: no element matched "${input.rect}".`,
      );
    }

    rect = target.getBoundingClientRect();
  }

  let screenshotPath: string | undefined;

  if (input.screenshot) {
    screenshotPath = input.outPath.replace(/\.json$/, '.png');
    await page.screenshot({ path: screenshotPath });
  }

  await commands.writeFile(
    input.outPath,
    JSON.stringify(
      {
        runId: input.runId,
        mode: input.mode,
        tier: 'browser',
        ok: true,
        scheme: input.scheme ?? 'default',
        html,
        portalHtml,
        css,
        ruleCount: splitRules(css).length,
        computed,
        rect: rect && {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
        screenshotPath,
        warnings: [...baseline.warnings, ...full.warnings],
      },
      null,
      2,
    ),
  );

  // Asserts the same thing as the jsdom tier — "something is on the page" —
  // rather than "something was styled". Counting CSS but not markup fails a
  // snippet that renders fine yet produces no NEW rules: plain DOM like
  // `<div>hi</div>`, or a component whose rules are already in the baseline so
  // `diffRules` returns empty. Portals count because an overlay renders nothing
  // inline.
  expect(
    html.length + portalHtml.join('').length + css.length + (computed ? 1 : 0),
  ).toBeGreaterThan(0);
});

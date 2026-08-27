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
import { type ComponentType } from 'react';
import { expect, it } from 'vitest';
import { commands, page } from 'vitest/browser';

import { Root } from '../../components/Root';
import { canonicalize, captureCss, diffRules, splitRules } from '../../probe';

import { assertConfigApplied } from './config-guard';

import type { ProbeInput } from './io';

declare const __PROBE_INPUT__: string;

const input = JSON.parse(__PROBE_INPUT__) as ProbeInput & {
  computed?: string;
  computedProps?: string[];
  rect?: string;
  screenshot?: boolean;
  scheme?: 'light' | 'dark' | 'hc';
  highContrast?: boolean;
};

/**
 * Drive the scheme the way a host app does — through the attributes on `<html>`
 * that the `@dark` / `@hc` predefined states resolve against (see `Root.tsx`).
 * Setting a token by hand would prove nothing about how the real cascade
 * behaves.
 *
 * The two axes are independent, so they are separate parameters: `@hc` is a
 * contrast attribute that composes with either scheme. `--scheme hc` stays
 * accepted as the spelling Cube Cloud's probe uses, where it means light + high
 * contrast — but it cannot express dark + high contrast, which is a real palette
 * variant, so `--hc` is the flag that reaches all four.
 */
function applyScheme(scheme: string | undefined, highContrast: boolean): void {
  const root = document.documentElement;

  if (scheme === 'dark') {
    root.setAttribute('data-scheme', 'dark');
  }
  if (scheme === 'light' || scheme === 'hc') {
    root.setAttribute('data-scheme', 'light');
  }
  if (scheme === 'hc' || highContrast) {
    root.setAttribute('data-contrast', 'high');
  }
}

/**
 * Pull the error out of Vite's 500 page.
 *
 * That page is not a message, it is a document: an HTML shell whose only content
 * is a `<script>` assigning the error as JSON and handing it to Vite's own
 * overlay. Printing the shell buries the one line that matters — the parse error
 * and its code frame — under a stack trace through Vite's internals and a copy of
 * the wrapped snippet, so the JSON is unpacked and only `message` (which already
 * carries file, line and frame) plus the plugin that raised it are kept.
 *
 * Returns undefined rather than guessing if the shape is not what we expect, so
 * the caller can fall back to the raw body: an unrecognised error page is still
 * better than a report that the error page was unrecognised.
 */
function extractViteError(body: string): string | undefined {
  const match = body.match(/const error = (\{.*\})\s*$/m);

  if (!match) return undefined;

  try {
    const error = JSON.parse(match[1]) as {
      message?: string;
      plugin?: string;
      id?: string;
    };

    if (!error.message) return undefined;

    return [
      error.message.trim(),
      error.plugin && `  Plugin: ${error.plugin}`,
      error.id && `  File: ${error.id}`,
    ]
      .filter(Boolean)
      .join('\n');
  } catch {
    return undefined;
  }
}

/**
 * Recover the dev server's actual error behind Chromium's opaque import failure.
 *
 * `await import(url)` on a module Vite could not transform rejects with
 * `Failed to fetch dynamically imported module: <url>` and nothing else. The
 * parse error — message, file, line, code frame — is in the 500 response body,
 * which the browser deliberately keeps from script. So the SAME typo that the
 * jsdom tier reports as an oxc parse error at `snippet.tsx:2:11` read here as a
 * network fault against a URL nobody typed, on the tier that is slower to reach
 * and therefore the one you are least willing to re-run blind.
 *
 * Re-requesting the module is what exposes the body: a failed transform is not
 * cached as a success, so the second request fails the same way and hands us the
 * text. A 2xx means `snippet.tsx` compiles fine and the break is in something it
 * imports — worth saying explicitly, because that is the case where the snippet
 * is not the thing to go read.
 *
 * `needsServerLog` is what the CLI keys the dev server's log off. The log is the
 * only place a transitive failure is named, but it is also a duplicate of this
 * message whenever the 500 body could be read — and printing the same parse error
 * twice, the second copy wrapped in a Vite stack trace, is how the useful half
 * stops being read.
 */
async function explainImportFailure(
  error: unknown,
  url: string,
): Promise<{ message: string; needsServerLog: boolean }> {
  const message = error instanceof Error ? error.message : String(error);

  // Anything else already names its own cause — a missing export, for one,
  // reports which export was missing from which module.
  if (!message.includes('Failed to fetch dynamically imported module')) {
    return { message, needsServerLog: false };
  }

  try {
    const response = await fetch(url);
    const body = (await response.text()).trim();

    if (!response.ok) {
      const extracted = extractViteError(body);

      return extracted
        ? { message: extracted, needsServerLog: false }
        : {
            message:
              `The dev server answered ${response.status} for ${url} with a body this ` +
              `harness does not recognise:\n\n${body.slice(0, 2000) || '(empty body)'}`,
            needsServerLog: true,
          };
    }

    return {
      message:
        `${message}\n\n` +
        `The module itself compiles — re-requesting it returned ${response.status} — so the ` +
        `failure is in something it imports, or in linking their exports together. The dev ` +
        `server's log below names the file.`,
      needsServerLog: true,
    };
  } catch (fetchError) {
    return {
      message:
        `${message}\n\n` +
        `Re-requesting it to recover the server's error also failed: ` +
        `${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
      needsServerLog: true,
    };
  }
}

it('probe:browser', async () => {
  // Same guard as the jsdom tier. It matters more here, not less: this is the
  // tier reached for precisely because its numbers are meant to be trustworthy,
  // so an unresolved unit would surface as a confident `rgb(...)` and a real
  // pixel geometry rather than as visibly missing output.
  assertConfigApplied();

  applyScheme(input.scheme, Boolean(input.highContrast));

  const view = render(<Root>{null}</Root>);
  const baseline = captureCss(view.baseElement);

  let Snippet: ComponentType;

  try {
    // `snippetUrl`, not `snippetPath` — see the field's note in `io.ts`.
    const module = (await import(/* @vite-ignore */ input.snippetUrl!)) as {
      default: ComponentType;
    };

    Snippet = module.default;
  } catch (error) {
    const { message, needsServerLog } = await explainImportFailure(
      error,
      input.snippetUrl!,
    );

    await commands.writeFile(
      input.outPath,
      JSON.stringify({
        runId: input.runId,
        mode: 'render',
        tier: 'browser',
        ok: false,
        kind: 'compile',
        message,
        needsServerLog,
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

  // `<Snippet />`, not `module.default()` — see the jsdom harness for why:
  // calling it runs hooks outside React's render phase. A throw here is a RENDER
  // failure rather than a compile one, and is reported as such.
  try {
    view.rerender(
      <Root>
        <div data-probe-scope="">
          <Snippet />
        </div>
      </Root>,
    );
  } catch (error) {
    await commands.writeFile(
      input.outPath,
      JSON.stringify({
        runId: input.runId,
        mode: 'render',
        tier: 'browser',
        ok: false,
        kind: 'render',
        message: error instanceof Error ? error.message : String(error),
      }),
    );

    return;
  }

  const full = captureCss(view.baseElement);
  const scope = view.baseElement.querySelector('[data-probe-scope]');

  // `--canonical` applies on both tiers. It is what makes two runs comparable
  // byte-for-byte, and a browser run is exactly where you would diff one scheme
  // or viewport against another — accepting the flag and returning raw hashes
  // and `useId` counters would defeat the comparison silently.
  const normalise = (text: string) =>
    input.canonical ? canonicalize(text) : text;

  const css = normalise(
    input.fullCss ? full.text : diffRules(baseline.text, full.text).join('\n'),
  );

  const html = normalise((scope ?? view.baseElement).innerHTML);

  const portalHtml = [...view.baseElement.querySelectorAll('*')]
    .filter(
      (node) =>
        !before.has(node) &&
        !scope?.contains(node) &&
        node.parentElement != null &&
        (before.has(node.parentElement) ||
          node.parentElement === view.baseElement),
    )
    .map((node) => normalise(node.outerHTML));

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
        scheme: `${input.scheme ?? 'default'}${
          input.highContrast && input.scheme !== 'hc' ? ' + high contrast' : ''
        }`,
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

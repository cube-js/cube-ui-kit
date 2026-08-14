/**
 * Extracting the CSS a rendered subtree actually caused.
 *
 * The naive approach — read `getCSSTextForNode` for the node you care about —
 * does not work under a `<Root>`, for two independent reasons:
 *
 * 1. `<Root>` declares the whole design-system token block, so the dump is
 *    dominated by rules the subtree did not cause (~119KB of ~135KB in Cube
 *    Cloud's console-ui).
 * 2. Scoping the query to an inner wrapper looks like the fix and is not:
 *    `<Root>` is the `PortalProvider` target, so Dialog / Menu / Tooltip /
 *    Select popups mount as *siblings* of that wrapper. Their CSS — and their
 *    markup — silently vanish from the result.
 *
 * So measure the whole region twice and subtract: capture the empty harness,
 * mount the subject, capture again, and diff. Portals are inside the measured
 * region in both passes, so they survive.
 */
import { getCSSTextForNode } from '@tenphi/tasty';

/** One captured pass: the raw CSS text plus any rules the engine rejected. */
export interface CssCapture {
  text: string;
  warnings: string[];
}

/**
 * Split a `getCSSTextForNode` dump into individual rules.
 *
 * The dump is one rule per line, including at-rules whose block is inlined onto
 * the same line, so lines are the natural unit.
 */
export function splitRules(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Rules present in `full` but not in `baseline`, in their original order.
 *
 * Set-based rather than positional: the injector is free to reorder or coalesce
 * chunks between passes, and a positional diff would report the whole tail as
 * new the first time that happens.
 */
export function diffRules(baseline: string, full: string): string[] {
  const seen = new Set(splitRules(baseline));

  return splitRules(full).filter((rule) => !seen.has(rule));
}

/**
 * Capture the CSS for a node, collecting the rules the CSS engine refused.
 *
 * jsdom does not merely fail to *resolve* `@container style()` and `@property`
 * rules — it discards them, so a jsdom-derived dump is incomplete rather than
 * unresolved for any component that uses them. tasty reports each rejection
 * through `console.warn`, so collect them rather than suppressing: a caller
 * needs to know when its answer is partial.
 *
 * Matched case-insensitively — tasty emits `[Tasty]` with a capital T, and this
 * repo's own jsdom setup filtered for `[tasty]` for a long time without ever
 * matching.
 */
export function captureCss(node: ParentNode): CssCapture {
  const warnings: string[] = [];
  const original = console.warn;

  console.warn = (...args: unknown[]) => {
    const first = args[0];

    if (
      typeof first === 'string' &&
      first.toLowerCase().includes('browser rejected css rule')
    ) {
      warnings.push(args.slice(1).map(String).join(' '));

      return;
    }

    original(...args);
  };

  try {
    return { text: getCSSTextForNode(node), warnings };
  } finally {
    console.warn = original;
  }
}

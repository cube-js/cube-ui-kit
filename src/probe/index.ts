/**
 * `@cube-dev/ui-kit/probe` — helpers for inspecting what a render produced.
 *
 * For tooling that answers "what HTML and CSS did this component tree actually
 * generate?" — the question that otherwise costs a throwaway test file per ask.
 *
 * Deliberately small, and deliberately DOM-pure: everything here operates on an
 * already-rendered node, so it carries no opinion about how you rendered it and
 * adds no dependency on a test renderer. Consumers wrap their own provider
 * stack, which is the part that genuinely differs between apps — this package's
 * harness is `<Root>`, while a product's is usually router + data-layer +
 * `<Root>`.
 *
 * `renderStyles` (what CSS does this styles object produce) and
 * `renderColorTokens` (what do the color tokens resolve to) are already on the
 * main entry and are not duplicated here.
 *
 * Note for consumers reading CSS out of a jsdom render: jsdom *discards*
 * `@container style()` and `@property` rules rather than degrading them, so the
 * result is incomplete for components that use them. `captureCss` reports those
 * rejections in `warnings` — surface them rather than dropping them, or you
 * will hand someone a confidently partial answer.
 */
export {
  canonicalize,
  canonicalizeClassNames,
  canonicalizeIds,
} from './canonicalize';
export { captureCss, diffRules, splitRules } from './css';
export type { CssCapture } from './css';

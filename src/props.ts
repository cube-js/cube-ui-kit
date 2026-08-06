/**
 * A loosely-typed props bag.
 *
 * Previously re-exported from `@tenphi/tasty`, which dropped it in v3 — it was
 * never a Tasty concept, just `Record<string, any>`. Declared here so the UI Kit
 * keeps exporting it for consumers.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Props = Record<string, any>;

/**
 * Normalising generated identifiers out of rendered output.
 *
 * Moved here from `src/eslint-plugin/probe.tsx` so consumers can reach them:
 * that file is not part of the `./eslint-plugin` entry, so nothing outside this
 * repo could import it. `probe.tsx` re-exports them, so its own callers and the
 * defaults registry are unaffected.
 *
 * Both functions exist for the same reason — comparing two renders byte-for-byte
 * requires dropping values that are arbitrary per render but structurally
 * meaningful in aggregate.
 */

/**
 * Replace generated element IDs with positional placeholders.
 *
 * React's `useId` draws from a global counter, so the same tree rendered twice
 * yields `«r0»` then `«r2»` and a byte comparison would fail for every
 * component that labels an input. Rewriting each distinct ID to `«idN»` in
 * order of first appearance keeps the `id` <-> `aria-labelledby` / `for`
 * relationships meaningful — a structural change still shows up as a
 * difference — while dropping the counter's absolute value.
 */
export function canonicalizeIds(text: string): string {
  const seen = new Map<string, string>();

  const replace = (match: string) => {
    let placeholder = seen.get(match);

    if (!placeholder) {
      placeholder = `«id${seen.size}»`;
      seen.set(match, placeholder);
    }

    return placeholder;
  };

  return (
    text
      .replace(/«[^»]*»/g, replace)
      // react-aria mints its own counter-based IDs in several shapes:
      // `react-aria1`, `react-aria-1`, and `react-aria-description-0`.
      .replace(/\breact-aria[\w-]*?\d+\b/g, replace)
  );
}

/**
 * Replace tasty's generated class names with positional placeholders.
 *
 * The hash is derived from the *input* style object, not the CSS it produces, so
 * two inputs that normalise to identical CSS still get different class names.
 * `<Space>` sets `gap: true` and `<Space gap="1x">` resolves to the same
 * `gap: var(--gap)` — the emitted rules are byte-identical and only the hash
 * differs.
 *
 * Placeholders are assigned in order of first appearance, so this cannot hide a
 * genuine difference: an extra, missing or reordered class shifts the sequence
 * and still compares unequal. Only the arbitrary hash value is normalised away.
 *
 * The pattern requires a digit so it matches `t1iuxaru` / `tp3unhd` without
 * touching all-letter CSS keywords that happen to start with `t` (`translate`,
 * `transform`).
 */
export function canonicalizeClassNames(text: string): string {
  const seen = new Map<string, string>();

  return text.replace(
    /\bt(?=[a-z0-9]{6,8}\b)(?![a-z]+\b)[a-z0-9]{6,8}\b/g,
    (match) => {
      let placeholder = seen.get(match);

      if (!placeholder) {
        placeholder = `tcls${seen.size}`;
        seen.set(match, placeholder);
      }

      return placeholder;
    },
  );
}

/** Both normalisations, in the order a probe applies them. */
export function canonicalize(text: string): string {
  return canonicalizeClassNames(canonicalizeIds(text));
}

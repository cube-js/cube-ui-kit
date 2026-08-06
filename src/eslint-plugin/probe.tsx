import { getCSSTextForNode } from '@tenphi/tasty';
import { ReactElement } from 'react';

import { cleanup, renderWithRoot } from '../test';

import { DefaultValue, PropEntry, SkipReason } from './types';

/**
 * The differential-render prover.
 *
 * Rather than extracting defaults from source — which cannot work here, since a
 * default may be established by destructuring, a `??` chain, a JSX-site
 * fallback, a `tasty()` factory option, a context, an alias map, or a tasty
 * style — we *prove* a default by rendering twice and comparing output. If
 * passing the prop changes nothing observable, it is redundant.
 *
 * Validated in `probe.test.tsx`: tasty class names are content-hashed and
 * deterministic, so raw markup + CSS compares byte-for-byte with no
 * normalisation.
 */

export interface Probe {
  markup: string;
  css: string;
}

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

export function probe(ui: ReactElement): Probe {
  // `baseElement` (document.body), not `container`: overlay components render
  // through a portal, so their markup never appears inside the container.
  const { baseElement } = renderWithRoot(ui);

  try {
    return {
      markup: canonicalizeIds(baseElement.innerHTML),
      css: canonicalizeIds(getCSSTextForNode(baseElement)),
    };
  } finally {
    // `cleanup()`, not `unmount()`: unmount tears down the React tree but leaves
    // RTL's now-empty container div in `document.body`, so the next probe's
    // `baseElement` markup would differ by that leftover div and every
    // comparison would be false. `cleanup()` removes the containers as well.
    cleanup();
  }
}

export function probesMatch(a: Probe, b: Probe): boolean {
  return a.markup === b.markup && a.css === b.css;
}

/**
 * A render fixture for one component. `render` receives extra props to merge
 * onto the component under test; everything else (required props, children,
 * necessary wrappers) is the fixture's job.
 */
export interface Fixture {
  /** Exported name from `@cube-dev/ui-kit`, e.g. `Button` or `Button.Split`. */
  name: string;
  render: (props: Record<string, unknown>) => ReactElement;
  /**
   * Conditions under which a default might shift: a provider that supplies the
   * prop, or a co-prop that changes the derived default. If a prop's verdict
   * differs between the bare render and *any* of these, it is not safe to flag.
   */
  conditions?: Condition[];
  /** Props this fixture cannot meaningfully probe (e.g. it sets them itself). */
  ignoreProps?: string[];
  /**
   * Exclusions a human has already triaged, recorded instead of re-probed.
   *
   * Use this when a prop provably cannot be linted for a reason the probe can
   * see but not explain — the probe reports "differs", and only a person can say
   * whether that is docs drift or an inherent reflection like `data-size`.
   * Recording it here keeps the reason in the registry rather than leaving a
   * bare `unverified` that looks untriaged forever.
   */
  curatedSkips?: Record<string, { reason: SkipReason; note: string }>;
  /**
   * Extra literals that mean the same thing as a prop's default, added by hand.
   *
   * Only for values a component genuinely normalises to the default — `Dialog`
   * maps `M` onto `medium` through a lookup table, so both spellings are equally
   * redundant. Do not add values that merely *render* alike; see the note above.
   */
  curatedAliases?: Record<string, DefaultValue[]>;
}

export interface Condition {
  label: string;
  /** Wraps the element in a provider, and/or merges co-props onto it. */
  wrap?: (ui: ReactElement) => ReactElement;
  props?: Record<string, unknown>;
}

/**
 * Classify one prop against one candidate default value.
 *
 * The prop is only reported as a verified default when passing it is a proven
 * no-op in the bare tree *and* under every declared condition. A verdict that
 * changes between conditions is the signature of a conditional or
 * context-derived default, which must never be flagged.
 */
export function classifyProp(
  fixture: Fixture,
  prop: string,
  value: DefaultValue,
): PropEntry {
  const bare = probe(fixture.render({}));
  const withProp = probe(fixture.render({ [prop]: value }));

  if (!probesMatch(bare, withProp)) {
    // Either the documented default has drifted from the implementation, the
    // value needs alias normalisation, or the default is a tasty state map that
    // this value replaces wholesale. All three need a human — never a guess.
    return {
      kind: 'skip',
      reason: 'unverified',
      note: `Rendering <${fixture.name} ${prop}={${JSON.stringify(value)}}> differs from omitting it, so the documented default could not be reproduced. Check for docs drift, an alias mapping, or a state-map style default.`,
    };
  }

  for (const condition of fixture.conditions ?? []) {
    // A condition that sets the prop under test cannot say anything about it:
    // merging the probed value on top would simply compare two different
    // explicit values (`type="link"` vs `type="outline"`) and report every such
    // prop as conditional.
    if (condition.props && prop in condition.props) continue;

    const wrap = condition.wrap ?? ((ui: ReactElement) => ui);
    const base = { ...condition.props };

    const conditionBare = probe(wrap(fixture.render(base)));
    const conditionWithProp = probe(
      wrap(fixture.render({ ...base, [prop]: value })),
    );

    if (!probesMatch(conditionBare, conditionWithProp)) {
      const reason: SkipReason = condition.wrap ? 'context' : 'conditional';

      return {
        kind: 'skip',
        reason,
        note: `Redundant in a bare tree but load-bearing under "${condition.label}", so removing it would change behaviour there.`,
      };
    }
  }

  return { kind: 'default', value };
}

/*
 * Aliases are deliberately NOT auto-derived — see `curatedAliases`.
 *
 * The idea was tempting: probe the rest of a prop's documented union and treat
 * any value that renders like the default as an alias, which would catch
 * `<Dialog size="medium">` against the `M` default for free. It does not hold.
 *
 * "Renders the same" is not "is the same". Two failures showed up immediately:
 *
 *   - A prop that is inert in the fixture makes *every* value look equivalent.
 *     `Item`'s `level` does nothing without a heading, so `level={1}` matched
 *     `level={3}`.
 *   - Worse, and not fixable by any DOM comparison: a prop whose values differ
 *     only in *behaviour*. `InlineInput`'s `editTrigger` wires a click handler
 *     versus a dblclick handler and renders byte-identical markup either way, so
 *     `click` was reported as an alias of the `dblclick` default. Autofixing
 *     that would silently change how the component activates.
 *
 * Guarding on "some other value must differ" catches the first case but not the
 * second, because `editTrigger="none"` genuinely does change the DOM. Claiming
 * X is equivalent to Y needs behavioural equivalence, which rendering cannot
 * establish — so aliases stay hand-curated.
 */

/**
 * Parse a default as written in a `.docs.mdx` `(default: \`x\`)` annotation.
 * The corpus is inconsistently quoted — `medium` and `'medium'`, `top` and
 * `'top'` both occur — so unwrap quotes before comparing.
 */
export function parseDocDefault(raw: string): DefaultValue | undefined {
  const text = raw.trim();

  if (text === '') return undefined;
  if (text === 'true') return true;
  if (text === 'false') return false;

  // `undefined` / `null` document the *absence* of a default, not a value to
  // compare a JSX attribute against. Without this they parse as the strings
  // "undefined"/"null" and get probed as nonsense values.
  if (text === 'undefined' || text === 'null') return undefined;

  const unquoted = text.replace(/^['"`](.*)['"`]$/, '$1');

  if (unquoted === '') return '';
  if (unquoted !== text) return unquoted;

  // Reject anything that isn't a plain literal: `undefined`, `[]`, `() => {}`,
  // `$size-md * 2`, prose like "auto (computed)". These cannot be compared to a
  // JSX attribute value, so they are not candidates.
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  if (!/^[\w-]+$/.test(text)) return undefined;

  return text;
}

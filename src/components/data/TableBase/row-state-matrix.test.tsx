import { getCSSTextForNode } from '@tenphi/tasty';

import { renderWithRoot } from '../../../test';
import { ItemTable } from '../ItemTable/ItemTable';

/**
 * Guards the three-way split described in `src/components/data/AGENTS.md`.
 *
 * Tasty coalesces entries in a single state map that share a serialized value,
 * promotes them to the group's maximum priority, and negates them against
 * everything below — silently turning a middle-priority compound rule into
 * FALSE. A row carries exactly the `selected × hovered × focused × disabled ×
 * dimmed × odd` matrix that triggers it, so the row paint is split across three
 * orthogonal custom properties instead of one `fill` map.
 *
 * These assert the *generated CSS*, not rendered pixels: jsdom cannot evaluate
 * `:hover`, and the failure being guarded is a rule vanishing at compile time.
 */
function renderTableCss() {
  const { container } = renderWithRoot(
    <ItemTable
      data={[{ id: '1', name: 'Alpha' }]}
      columns={[{ key: 'name', title: 'Name' }]}
    />,
  );

  return getCSSTextForNode(container);
}

interface Rule {
  selector: string;
  body: string;
}

function parseRules(css: string): Rule[] {
  return [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map((match) => ({
    selector: match[1].trim(),
    body: match[2].trim(),
  }));
}

/**
 * Rules targeting a body `Row` itself — not `HeadRow`/`FootRow`, which
 * legitimately repeat values because they neutralise the inherited tokens.
 */
function bodyRowRules(css: string): Rule[] {
  return parseRules(css).filter(
    (rule) =>
      rule.selector.includes('[data-element="Body"] > [data-element="Row"]') &&
      !rule.selector.includes('[data-element="Cell"]'),
  );
}

function declaredValues(rules: Rule[], property: string): string[] {
  return rules
    .map((rule) => rule.body.match(new RegExp(`${property}:\\s*([^;]+)`))?.[1])
    .filter((value): value is string => value != null)
    .map((value) => value.trim());
}

describe('row state matrix', () => {
  it('gives every interaction state its own overlay value', () => {
    const overlays = declaredValues(
      bodyRowRules(renderTableCss()),
      '--row-overlay-color',
    );

    // Seven states: default, hover, focused, selected, selected+hover,
    // drop-target, disabled.
    expect(overlays).toHaveLength(7);
    // A duplicate here is the smoking gun for the merge — two states that were
    // meant to differ collapsing onto one value, after which the lower-priority
    // one is negated out of existence.
    expect(new Set(overlays).size).toBe(overlays.length);
  });

  it('keeps `selected & hovered` as a rule distinct from `selected`', () => {
    const rules = bodyRowRules(renderTableCss()).filter((rule) =>
      rule.body.includes('--row-overlay-color'),
    );

    const compound = rules.find(
      (rule) =>
        rule.selector.includes('[data-selected]:hover') ||
        /\[data-selected\][^,]*:hover/.test(rule.selector),
    );

    // This is the rule that disappears when the merge fires: it sits between
    // `hovered` and the top of the group.
    expect(compound).toBeDefined();
    expect(compound!.body).toMatch(/--row-overlay-color:\s*rgb\(/);
  });

  it('keeps `dimmed` out of the fill maps entirely', () => {
    const dimmed = bodyRowRules(renderTableCss()).filter((rule) =>
      rule.selector.includes('[data-dimmed]'),
    );

    expect(dimmed.length).toBeGreaterThan(0);

    for (const rule of dimmed) {
      // `dimmed` drives text colour and opacity only. Putting it into
      // `#row-overlay` would reintroduce the collision this split avoids.
      expect(rule.body).not.toContain('--row-overlay-color');
    }
  });

  it('keeps the zebra base independent of the interaction overlay', () => {
    const rules = bodyRowRules(renderTableCss());
    const bases = declaredValues(rules, '--row-base-color');

    // Distinctness is the invariant, not the count: entries in one state map
    // that share a serialized value get merged to the group's maximum priority
    // and negated against everything below (see src/data/AGENTS.md). A new base
    // may be added — `pinned` is one — but never one that repeats another.
    expect(bases.length).toBeGreaterThanOrEqual(2);
    expect(new Set(bases).size).toBe(bases.length);

    for (const rule of rules) {
      if (!rule.body.includes('--row-base-color')) continue;
      expect(rule.body).not.toContain('--row-overlay-color');
    }
  });
});

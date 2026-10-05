import { getCSSTextForNode } from '@tenphi/tasty';

import { renderWithRoot } from '../../../test';
import { ItemTable } from '../ItemTable/ItemTable';

/**
 * Guards the three-way split described in `src/components/data/AGENTS.md`.
 *
 * Base, interaction overlay and text/dimming can change independently without
 * enumerating all of their state combinations.
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
 * Rules targeting a body `Row` itself, excluding `HeadRow`/`FootRow`.
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
  it('keeps `selected & hovered` as a rule distinct from `selected`', () => {
    const rules = bodyRowRules(renderTableCss()).filter((rule) =>
      rule.body.includes('--row-overlay-color'),
    );

    const compound = rules.find(
      (rule) =>
        rule.selector.includes('[data-selected]:hover') ||
        /\[data-selected\][^,]*:hover/.test(rule.selector),
    );

    expect(compound).toBeDefined();
    // Matched on the token it derives from, not on how the opacity is applied:
    // Tasty fades a colour token with `color-mix()`, and that form is its
    // business to change.
    expect(compound!.body).toMatch(
      /--row-overlay-color:[^;]*var\(--surface-text-color\)/,
    );
  });

  it('keeps `dimmed` out of the fill maps entirely', () => {
    const dimmed = bodyRowRules(renderTableCss()).filter((rule) =>
      rule.selector.includes('[data-dimmed]'),
    );

    expect(dimmed.length).toBeGreaterThan(0);

    for (const rule of dimmed) {
      // `dimmed` drives text colour and opacity independently of interaction.
      expect(rule.body).not.toContain('--row-overlay-color');
    }
  });

  it('keeps the zebra base independent of the interaction overlay', () => {
    const rules = bodyRowRules(renderTableCss());
    const bases = declaredValues(rules, '--row-base-color');

    expect(bases.length).toBeGreaterThanOrEqual(2);

    for (const rule of rules) {
      if (!rule.body.includes('--row-base-color')) continue;
      expect(rule.body).not.toContain('--row-overlay-color');
    }
  });
});

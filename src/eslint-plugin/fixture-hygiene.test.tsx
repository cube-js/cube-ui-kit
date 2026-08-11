import { isValidElement } from 'react';

import * as UIKit from '../index';

import { readDocumentedDefaults } from './docs-defaults';
import { FIXTURES } from './fixtures';

import type { ReactElement, ReactNode } from 'react';

/**
 * Guards the one way a fixture can make the probe lie.
 *
 * `probe` proves a default by rendering the fixture with and without the prop and
 * comparing output. If the fixture hardcodes that prop on the component, the value
 * is present in *both* renders — they match, and the prop is recorded as defaulted
 * whether it actually is or not. Nothing downstream can tell the difference: the
 * registry looks proven, `defaults.test.ts` re-proves it the same contaminated way,
 * and the lint rule then tells consumers to delete a prop nobody verified.
 *
 * That is not hypothetical. `ResizablePanel`'s fixture hardcoded `direction="right"`
 * — needed only because the prop was mistyped as required — and the rule stripped
 * explicit `direction="right"` from a consumer whose build then failed. `FilterPicker`
 * and `GridProvider` had the same shape; both happened to be correct, which is
 * exactly why it went unnoticed.
 *
 * The fix for a hit here is to render the component bare so the probe can do its
 * job. Reach for `ignoreProps` only when the fixture genuinely cannot render without
 * the prop — that drops the entry from the registry rather than proving it.
 */

/** Resolve a fixture's `name` (possibly dotted, e.g. `Button.Split`) to its component. */
function resolveComponent(name: string): unknown {
  return name
    .split('.')
    .reduce<unknown>(
      (target, part) => (target as Record<string, unknown>)?.[part],
      UIKit as unknown,
    );
}

/**
 * Prop names set directly on `component` anywhere in the tree.
 *
 * Scoped to the target component on purpose — several fixtures legitimately pass a
 * same-named prop to a host wrapper (`AlertDialog` needs `<DialogTrigger isDismissable>`
 * to have a dialog context at all), and that does not contaminate the component's own
 * probe.
 */
function propsSetOnComponent(node: ReactNode, component: unknown): string[] {
  if (Array.isArray(node)) {
    return node.flatMap((child) =>
      propsSetOnComponent(child as ReactNode, component),
    );
  }

  if (!isValidElement(node)) {
    return [];
  }

  const element = node as ReactElement;
  const props = element.props as Record<string, unknown>;
  const own =
    element.type === component
      ? Object.keys(props).filter((key) => key !== 'children')
      : [];

  return [
    ...own,
    ...propsSetOnComponent(props.children as ReactNode, component),
  ];
}

describe('fixture hygiene', () => {
  it('no fixture hardcodes a prop it is supposed to probe', () => {
    const offenders: string[] = [];

    for (const fixture of FIXTURES) {
      const component = resolveComponent(fixture.name);

      if (!component) continue;

      let element: ReactElement;
      try {
        element = fixture.render({});
      } catch {
        // A fixture that cannot render bare cannot hardcode-contaminate either —
        // it reaches the probe through `conditions`/`ignoreProps` instead.
        continue;
      }

      const hardcoded = new Set(propsSetOnComponent(element, component));
      const ignored = new Set(fixture.ignoreProps ?? []);
      const documented = readDocumentedDefaults(fixture.name)
        .map((entry) => entry.prop)
        .filter((prop) => hardcoded.has(prop) && !ignored.has(prop));

      if (documented.length) {
        offenders.push(`${fixture.name}: ${documented.sort().join(', ')}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('every fixture name resolves to an export', () => {
    // A typo'd name would make the guard above silently vacuous for that fixture,
    // since it skips anything it cannot resolve.
    expect(
      FIXTURES.map((fixture) => fixture.name).filter(
        (name) => !resolveComponent(name),
      ),
    ).toEqual([]);
  });
});

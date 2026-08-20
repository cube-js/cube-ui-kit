import { getCSSTextForNode } from '@tenphi/tasty';

import { Button, ItemAction } from '../components/actions';
import { ItemActionProvider } from '../components/actions/ItemActionContext';
import { renderWithRoot } from '../test';

import { canonicalizeClassNames } from './probe';

/**
 * Tests for the probe primitive itself: is a differential render byte-stable
 * enough to prove that a prop equals a component's default, and does it draw the
 * right conclusion when it isn't?
 *
 * These use a local `probe` over `container` deliberately — the production probe
 * in `probe.tsx` reads `baseElement` so it can see portals, and canonicalises
 * generated IDs. Keeping a minimal version here means these tests still fail if
 * tasty's class hashing ever stops being deterministic.
 */

function probe(ui: React.ReactElement) {
  const { container, unmount } = renderWithRoot(ui);
  const markup = container.innerHTML;
  const css = getCSSTextForNode(container);

  unmount();

  return { markup, css };
}

describe('spike: differential render probe', () => {
  // Button's real `type` default is established only at the JSX site
  // (`effectiveType ?? 'outline'`), so no static analysis can see it.
  it('collapses a known default (type="outline")', () => {
    const bare = probe(<Button>Hi</Button>);
    const explicit = probe(<Button type="outline">Hi</Button>);

    expect(explicit.markup).toBe(bare.markup);
    expect(explicit.css).toBe(bare.css);
  });

  it('does NOT collapse a non-default (type="primary")', () => {
    const bare = probe(<Button>Hi</Button>);
    const other = probe(<Button type="primary">Hi</Button>);

    expect(other.markup + other.css).not.toBe(bare.markup + bare.css);
  });

  // Button's base styles set `whiteSpace: 'nowrap'` and `verticalAlign: 'bottom'`
  // as plain scalars — case G, a default that lives only inside tasty styles.
  it.each([
    ['whiteSpace', 'nowrap'],
    ['verticalAlign', 'bottom'],
    ['placeContent', 'center'],
  ])('collapses scalar style default %s=%s', (prop, value) => {
    const bare = probe(<Button>Hi</Button>);
    const explicit = probe(<Button {...{ [prop]: value }}>Hi</Button>);

    expect(explicit.markup).toBe(bare.markup);
    expect(explicit.css).toBe(bare.css);
  });

  // A style prop whose default is a *state map* must NOT collapse: overriding it
  // with the default-state value drops the other branches. Button's `radius` is
  // `{ '': true, '@parent(button-split, >) & !:last-child': '1r left', ... }`.
  it('does NOT collapse a state-map style default (radius)', () => {
    const bare = probe(<Button>Hi</Button>);

    for (const value of ['1r', true] as const) {
      const explicit = probe(<Button radius={value}>Hi</Button>);

      expect(explicit.markup + explicit.css).not.toBe(bare.markup + bare.css);
    }
  });

  // The conditionality detector: a prop that looks redundant in a bare tree but
  // is load-bearing under a provider / co-prop must be detectably different.
  describe('detects condition-dependent defaults', () => {
    it('Button size="medium" collapses bare but not with type="link" (case B)', () => {
      const bare = probe(<Button>Hi</Button>);
      const bareExplicit = probe(<Button size="medium">Hi</Button>);

      expect(bareExplicit.markup + bareExplicit.css).toBe(
        bare.markup + bare.css,
      );

      const link = probe(<Button type="link">Hi</Button>);
      const linkExplicit = probe(
        <Button size="medium" type="link">
          Hi
        </Button>,
      );

      expect(linkExplicit.markup + linkExplicit.css).not.toBe(
        link.markup + link.css,
      );
    });

    it('ItemAction isDisabled={false} collapses bare but not under a provider (case E)', () => {
      const bare = probe(<ItemAction>Hi</ItemAction>);
      const bareExplicit = probe(
        <ItemAction isDisabled={false}>Hi</ItemAction>,
      );

      expect(bareExplicit.markup + bareExplicit.css).toBe(
        bare.markup + bare.css,
      );

      const wrapped = probe(
        <ItemActionProvider isDisabled>
          <ItemAction>Hi</ItemAction>
        </ItemActionProvider>,
      );
      const wrappedExplicit = probe(
        <ItemActionProvider isDisabled>
          <ItemAction isDisabled={false}>Hi</ItemAction>
        </ItemActionProvider>,
      );

      expect(wrappedExplicit.markup + wrappedExplicit.css).not.toBe(
        wrapped.markup + wrapped.css,
      );
    });
  });

  it('is stable across repeated identical renders', () => {
    const a = probe(<Button>Hi</Button>);
    const b = probe(<Button>Hi</Button>);

    expect(b.markup).toBe(a.markup);
    expect(b.css).toBe(a.css);
  });
});

describe('canonicalizeClassNames', () => {
  it('normalises hashes that differ while the CSS is identical', () => {
    const a = '.t1iuxaru.t1iuxaru { display: flex; gap: var(--gap); }';
    const b = '.t1it4mdz.t1it4mdz { display: flex; gap: var(--gap); }';

    expect(canonicalizeClassNames(a)).toBe(canonicalizeClassNames(b));
  });

  it('still distinguishes a real difference', () => {
    const a = '.t1iuxaru { display: flex; }';
    const b = '.t1it4mdz { display: grid; }';

    expect(canonicalizeClassNames(a)).not.toBe(canonicalizeClassNames(b));
  });

  it('distinguishes an extra class, since placeholders are positional', () => {
    const a = 'class="t1iuxaru tp3unhd"';
    const b = 'class="t1iuxaru tp3unhd tzsuqk4"';

    expect(canonicalizeClassNames(a)).not.toBe(canonicalizeClassNames(b));
  });

  it('leaves all-letter CSS keywords starting with t alone', () => {
    // `translate` and `transform` are within the length window; only the
    // digit requirement keeps them out.
    const css = 'transform: translate(1px); transition: none;';

    expect(canonicalizeClassNames(css)).toBe(css);
  });
});

import { act, renderWithRoot, screen, userEvent, waitFor } from '../../../test';

import { Disclosure } from './Disclosure';

/** Real time passing, inside act() so the resulting state updates are wrapped. */
const settle = (ms: number) =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });

const trigger = () => screen.getByRole('button', { name: 'Toggle' });
const panel = () => screen.queryByTestId('DisclosureContentWrapper');
const panelHeight = () => panel()?.getBoundingClientRect().height ?? 0;

interface HarnessProps {
  isExpanded: boolean;
  /** Mirrors Disclosure consumers that disable the animation while streaming. */
  transitionDuration?: number;
}

function Harness({ isExpanded, transitionDuration }: HarnessProps) {
  return (
    <Disclosure
      isExpanded={isExpanded}
      transitionDuration={transitionDuration}
      onExpandedChange={() => {}}
    >
      <Disclosure.Trigger>Toggle</Disclosure.Trigger>
      <Disclosure.Content>
        <div style={{ height: '120px' }}>Panel content</div>
      </Disclosure.Content>
    </Disclosure>
  );
}

/**
 * Disclosure's open/closed geometry, in a real browser.
 *
 * The panel animates `height: 0 → max-content` via `interpolate-size:
 * allow-keywords`, so its real height only exists where there is layout — jsdom
 * reports 0 for both states and cannot tell an open panel from a closed one.
 * That blind spot is why the panel collapsing to 0px shipped twice (#1209,
 * #1249) and why the header/content desync in CUB-3793 was invisible to the
 * suite.
 */
describe('Disclosure geometry', () => {
  it('opens and closes the panel for real', async () => {
    renderWithRoot(
      <Disclosure>
        <Disclosure.Trigger>Toggle</Disclosure.Trigger>
        <Disclosure.Content>
          <div style={{ height: '120px' }}>Panel content</div>
        </Disclosure.Content>
      </Disclosure>,
    );

    // Collapsed: the panel is not mounted at all.
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(panel()).not.toBeInTheDocument();

    await userEvent.click(trigger());

    await waitFor(() => expect(panelHeight()).toBeGreaterThan(100));
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(trigger());

    await waitFor(() => expect(panel()).not.toBeInTheDocument(), {
      timeout: 1000,
    });
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('does not leave the panel open when the header says collapsed', async () => {
    // CUB-3793. The chat passes transitionDuration={isStreaming ? 0 : undefined}
    // and collapses when the run ends; the two land in separate renders, so the
    // duration used to change while the collapse was still one frame from
    // starting — cancelling it and stranding the panel at full height under a
    // trigger that already read as collapsed.
    const { rerender } = renderWithRoot(
      <Harness isExpanded={true} transitionDuration={0} />,
    );

    await waitFor(() => expect(panelHeight()).toBeGreaterThan(100));

    rerender(<Harness isExpanded={false} transitionDuration={0} />);
    rerender(<Harness isExpanded={false} transitionDuration={undefined} />);

    await settle(400);

    // The invariant: the trigger and the panel agree.
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(panelHeight()).toBe(0);
  });
});

/**
 * The card trigger's corners, in a real browser.
 *
 * Both halves of this are invisible to jsdom: `border-radius` resolves through
 * `calc()` over `--card-radius` and `--border-width`, and the animation only
 * exists where transitions actually run.
 */
describe('Disclosure card radius', () => {
  const cornersOf = (el: Element) => {
    const { borderTopLeftRadius, borderBottomLeftRadius } =
      getComputedStyle(el);

    return { top: borderTopLeftRadius, bottom: borderBottomLeftRadius };
  };

  function CardHarness({
    transitionDuration,
  }: {
    transitionDuration?: number;
  }) {
    return (
      <Disclosure shape="card" transitionDuration={transitionDuration}>
        <Disclosure.Trigger>Toggle</Disclosure.Trigger>
        <Disclosure.Content>
          <div style={{ height: '120px' }}>Panel content</div>
        </Disclosure.Content>
      </Disclosure>
    );
  }

  it('drops the trigger bottom corners while open', async () => {
    renderWithRoot(<CardHarness />);

    // Collapsed: all four corners follow the root's inner radius, so the
    // trigger fills the card cleanly.
    const collapsed = cornersOf(trigger());
    expect(collapsed.bottom).toBe(collapsed.top);
    expect(parseFloat(collapsed.top)).toBeGreaterThan(0);

    await userEvent.click(trigger());
    await settle(400);

    // Open: only the top corners survive — the header joins the panel below it.
    const open = cornersOf(trigger());
    expect(open.top).toBe(collapsed.top);
    expect(open.bottom).toBe('0px');

    await userEvent.click(trigger());
    await settle(400);

    expect(cornersOf(trigger())).toEqual(collapsed);
  });

  it('animates the corners instead of snapping them', async () => {
    renderWithRoot(<CardHarness />);

    await userEvent.click(trigger());

    // Mid-flight the bottom corners are between their two end values, which
    // only holds if the change is transitioned.
    await waitFor(
      () => {
        const bottom = parseFloat(cornersOf(trigger()).bottom);

        expect(bottom).toBeGreaterThan(0);
        expect(bottom).toBeLessThan(parseFloat(cornersOf(trigger()).top));
      },
      { interval: 10, timeout: 200 },
    );
  });

  it('follows transitionDuration so the corners and the panel stay in step', async () => {
    renderWithRoot(<CardHarness transitionDuration={0} />);

    const durations = getComputedStyle(trigger()).transitionDuration;

    // `border-radius` is the only entry driven by the disclosure token, so it
    // is the only one the prop zeroes out.
    expect(durations.split(', ')).toContain('0s');
  });
});

/**
 * Disclosure's width against a constrained parent, in a real browser.
 *
 * The failure mode is the flex/grid automatic minimum size (`min-width: auto`),
 * which resolves to the panel's min-content width. jsdom reports 0 for every
 * box here, so it cannot see a panel pushing its own root past the parent.
 */
describe('Disclosure width', () => {
  const PARENTS: Array<[string, React.CSSProperties]> = [
    ['flex row', { display: 'flex', placeItems: 'center' }],
    ['grid', { display: 'grid' }],
    ['block', {}],
  ];

  /** Content far wider than the parent and unable to wrap. */
  function WideHarness({ parent }: { parent: React.CSSProperties }) {
    return (
      <div
        data-qa="WidthParent"
        style={{ ...parent, width: '400px', overflow: 'hidden' }}
      >
        <Disclosure defaultExpanded>
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Content>
            <pre>{'x'.repeat(300)}</pre>
          </Disclosure.Content>
        </Disclosure>
      </div>
    );
  }

  it.each(PARENTS)(
    'takes its width from a %s parent instead of its content',
    async (_name, parent) => {
      renderWithRoot(<WideHarness parent={parent} />);

      const parentEl = screen.getByTestId('WidthParent');
      const root = document.querySelector(
        '[data-qa="Disclosure"]',
      ) as HTMLElement;

      // Without this, the panel's min-content width became the root's minimum
      // and every consumer inside a flex/grid parent had to pass
      // `width="max 100%"` to claw it back — shrinking could not, since
      // flex-shrink cannot go below the automatic minimum.
      expect(Math.round(root.getBoundingClientRect().width)).toBe(400);
      expect(parentEl.scrollWidth).toBe(Math.round(parentEl.clientWidth));
    },
  );
});

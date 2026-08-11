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

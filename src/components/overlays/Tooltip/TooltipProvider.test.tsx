import { RefObject } from 'react';

import {
  act,
  hoverWithPointer,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
} from '../../../test';
import { Button } from '../../actions/Button/Button';

import { TooltipProvider } from './TooltipProvider';

describe('<TooltipProvider />', () => {
  /**
   * The provider used to render its children bare and swap them into
   * `TooltipTrigger` from an effect of its own — an SSR guard that cost every
   * client-rendered tree a second commit, and its trigger a remount one task
   * after everything watching the mount had already called it finished.
   *
   * Anything holding the trigger by then was left with a node React had
   * detached: a Storybook play function that resolved a button and clicked it
   * a few `await`s later saw the click go nowhere at all — no pointer event
   * reached the document — and Chromatic failed on a menu that never opened.
   * `useIsSSR` answers on the first render on the client, so there is no
   * second commit to be late.
   */
  it('mounts its trigger in a single commit', () => {
    const nodes = new Set<HTMLElement>();

    renderWithRoot(
      <TooltipProvider title="Tip">
        {(triggerProps, ref?: RefObject<HTMLElement>) => (
          <button
            {...triggerProps}
            ref={(element: HTMLButtonElement | null) => {
              if (element) nodes.add(element);
              if (ref)
                (ref as { current: HTMLElement | null }).current = element;
            }}
            type="button"
          >
            Trigger
          </button>
        )}
      </TooltipProvider>,
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(nodes.size).toBe(1);
  });

  /**
   * A disabled tooltip renders nothing, but its trigger used to open anyway.
   * While open, React Aria stops every `Escape` at the document and describes
   * the trigger by the id of a tooltip that is not there. `Item` and `Radio`
   * keep a disabled auto tooltip mounted while their label fits, so this hit
   * every button radio and every tab with actions.
   */
  it('keeps a disabled tooltip closed', async () => {
    const onKeyDown = vi.fn();

    renderWithRoot(
      <div onKeyDown={(event) => onKeyDown(event.key)}>
        <button type="button">Elsewhere</button>
        <TooltipProvider isDisabled title="Tip">
          {(triggerProps, ref?: RefObject<HTMLElement>) => (
            <span
              {...triggerProps}
              ref={(element: HTMLSpanElement | null) => {
                if (ref)
                  (ref as { current: HTMLElement | null }).current = element;
              }}
            >
              Trigger
            </span>
          )}
        </TooltipProvider>
      </div>,
    );

    screen.getByRole('button').focus();
    await hoverWithPointer(screen.getByText('Trigger'));
    // Past the default open delay.
    await act(() => new Promise((resolve) => setTimeout(resolve, 400)));

    expect(screen.getByText('Trigger')).not.toHaveAttribute('aria-describedby');

    await userEvent.keyboard('{Escape}');

    expect(onKeyDown).toHaveBeenCalledWith('Escape');
  });

  /**
   * The provider used to forward only `tooltipStyles` and `width` to the
   * tooltip, so a test had to find it by `role="tooltip"` — which works only
   * while exactly one is open and never says whose it is.
   */
  it('puts its qa on the rendered tooltip', async () => {
    renderWithRoot(
      <TooltipProvider title="Tip" qa="TriggerTooltip">
        <Button>Trigger</Button>
      </TooltipProvider>,
    );

    await userEvent.tab();

    await waitFor(() =>
      expect(screen.getByTestId('TriggerTooltip')).toHaveAttribute(
        'role',
        'tooltip',
      ),
    );
    expect(screen.getByTestId('TriggerTooltip')).toHaveTextContent('Tip');
  });

  it('takes the qa from a component’s tooltip object', async () => {
    renderWithRoot(
      <Button tooltip={{ title: 'Tip', qa: 'ButtonTooltip' }}>Trigger</Button>,
    );

    await userEvent.tab();

    await waitFor(() =>
      expect(screen.getByTestId('ButtonTooltip')).toHaveTextContent('Tip'),
    );
  });
});

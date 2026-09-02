import { RefObject } from 'react';

import { renderWithRoot, screen } from '../../../test';

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
});

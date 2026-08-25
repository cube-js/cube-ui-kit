import { FocusableRefValue } from '@react-types/shared';
import { useEffect, useRef, useState } from 'react';

import { renderWithRoot, screen, userEvent, waitFor } from '../../../test';
import { Button } from '../../actions/Button';

import { Dialog } from './Dialog';
import { DialogTrigger } from './DialogTrigger';

/**
 * The focus hand-off from a closing dialog, in a real browser (CUB-3962).
 *
 * The panel-order cases live here rather than in jsdom because that is where
 * jsdom is least trustworthy about them: whether the opened surface's mount
 * effect runs before or after the trigger's restore is decided by real
 * blur/focusin ordering across a real exit animation, and in jsdom the verdict
 * flipped run to run — the same spec caught the bug in `modal` on one run and
 * `popover` on the next. A test that only sometimes detects the regression is
 * worse than no test, so these moved.
 *
 * Both types are covered because they restore through different paths:
 * modal/tray/fullscreen/panel use `DialogTriggerBase`'s own restore, while
 * popovers use `Dialog`'s `FocusScope` (the manual one is a no-op there).
 */

function Panel() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div ref={ref} tabIndex={-1} data-qa="Panel">
      <button type="button">Close</button>
      Panel content
    </div>
  );
}

describe.each(['popover', 'modal'] as const)(
  'DialogTrigger focus hand-off (type=%s)',
  (type) => {
    function App({ panelFirst }: { panelFirst: boolean }) {
      const [isPanelOpen, setPanelOpen] = useState(false);
      const [isOpen, setOpen] = useState(false);

      const dialog = (
        <DialogTrigger type={type} isOpen={isOpen} onOpenChange={setOpen}>
          <Button qa="Trigger">Open</Button>
          <Dialog>
            <Button
              qa="Act"
              onPress={() => {
                setOpen(false);
                setPanelOpen(true);
              }}
            >
              Open panel
            </Button>
          </Dialog>
        </DialogTrigger>
      );

      return (
        <>
          {panelFirst && isPanelOpen ? <Panel /> : null}
          {dialog}
          {!panelFirst && isPanelOpen ? <Panel /> : null}
        </>
      );
    }

    it.each([true, false])(
      'leaves focus on the surface an action opens (panel first: %s)',
      async (panelFirst) => {
        const user = userEvent.setup();

        renderWithRoot(<App panelFirst={panelFirst} />);

        await user.click(screen.getByTestId('Trigger'));
        await screen.findByTestId('Dialog');
        await user.click(screen.getByTestId('Act'));

        const panel = await screen.findByTestId('Panel');

        // Past the trigger's restore and the Dialog FocusScope's unmount
        // restore after the exit animation.
        await new Promise((resolve) => setTimeout(resolve, 600));

        expect(panel).toHaveFocus();
      },
    );

    it('never restores focus to the trigger with shouldRestoreFocus={false}', async () => {
      const user = userEvent.setup();

      renderWithRoot(
        <DialogTrigger type={type} shouldRestoreFocus={false}>
          <Button qa="Trigger">Open</Button>
          {(close: () => void) => (
            <Dialog>
              <Button qa="Act" onPress={close}>
                Close
              </Button>
            </Dialog>
          )}
        </DialogTrigger>,
      );

      await user.click(screen.getByTestId('Trigger'));
      await screen.findByTestId('Dialog');
      await user.click(screen.getByTestId('Act'));

      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(screen.getByTestId('Trigger')).not.toHaveFocus();
    });
  },
);

/**
 * `shouldCloseOnInteractOutside`, in a real browser (CUB-4113).
 *
 * Deliberately a Cube `Button` rather than a plain `<button>`: the prop was
 * shadowed by the automatic `data-popover-dismiss` handling, which only
 * `Button` / `ItemButton` carry, so a plain button never reproduced the bug.
 *
 * In a browser rather than jsdom because the predicate's shape depends on real
 * pointer behaviour: React Aria passes the element the pointer landed on, which
 * for a `Button` is the label inside it, not the `<button>`. jsdom delivers a
 * pointer event straight to the node a test aimed at, so an identity check can
 * pass there and still be wrong in a browser — which is how the matching
 * Storybook story was originally written.
 *
 * Mirrors `Overlays/Dialog / Do Not Close On Click At Particular Element`.
 */
describe('DialogTrigger popover shouldCloseOnInteractOutside', () => {
  const user = userEvent.setup();

  it('keeps the popover open for the guarded element and still presses it', async () => {
    function App() {
      const guardedRef = useRef<FocusableRefValue<HTMLButtonElement>>(null);
      const [pressed, setPressed] = useState(false);

      return (
        <>
          <DialogTrigger
            type="popover"
            shouldCloseOnInteractOutside={(el) =>
              !guardedRef.current?.UNSAFE_getDOMNode()?.contains(el)
            }
          >
            <Button qa="Trigger">Open</Button>
            <Dialog>
              <Button qa="Inside">Inside</Button>
            </Dialog>
          </DialogTrigger>
          <Button
            ref={guardedRef}
            qa="Guarded"
            onPress={() => setPressed(true)}
          >
            {pressed ? 'It works!' : 'Click me!'}
          </Button>
        </>
      );
    }

    renderWithRoot(<App />);

    await user.click(screen.getByTestId('Trigger'));
    await screen.findByTestId('Dialog');

    await user.click(screen.getByText('Click me!'));

    // Settle past the auto-dismiss `setTimeout(0)` and the exit animation, so a
    // close that was only scheduled has had time to land.
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(screen.getByTestId('Dialog')).toBeInTheDocument();
    expect(screen.getByTestId('Guarded')).toHaveTextContent('It works!');
  });

  it('closes on an outside element the predicate allows', async () => {
    renderWithRoot(
      <>
        <DialogTrigger
          type="popover"
          shouldCloseOnInteractOutside={(el) =>
            !el.closest('[data-qa="Guarded"]')
          }
        >
          <Button qa="Trigger">Open</Button>
          <Dialog>
            <Button qa="Inside">Inside</Button>
          </Dialog>
        </DialogTrigger>
        <Button qa="Plain">Plain</Button>
      </>,
    );

    await user.click(screen.getByTestId('Trigger'));
    await screen.findByTestId('Dialog');

    await user.click(screen.getByTestId('Plain'));

    await waitFor(() =>
      expect(screen.queryByTestId('Dialog')).not.toBeInTheDocument(),
    );
  });
});

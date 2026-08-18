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

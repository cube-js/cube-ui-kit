import { renderWithRoot, screen, userEvent } from '../../../test';
import { Button } from '../../actions/Button';
import { ItemAction } from '../../actions/ItemAction';
import { Dialog } from '../Dialog/Dialog';
import { DialogTrigger } from '../Dialog/DialogTrigger';
import { useToast } from '../Toast/useToast';

import { NotificationAction } from './NotificationAction';
import { useNotifications } from './use-notifications';

/**
 * A press on a toast or notification must not close the Dialog it shows over.
 *
 * Both are portaled outside the Dialog, so React Aria counted a press on one
 * as a press outside it: the Dialog closed and the action never ran. React
 * Aria's own toast region is a top layer for this reason.
 *
 * In a browser rather than jsdom because outside-press detection there runs on
 * real pointer events.
 */
describe('Toasts and notifications over a Dialog', () => {
  const user = userEvent.setup();

  function Shows({ onPress }: { onPress: () => void }) {
    const toast = useToast();
    const { notify } = useNotifications();

    return (
      <>
        <Button
          qa="ShowToast"
          onPress={() =>
            toast({
              title: 'Saved',
              actions: <ItemAction onPress={onPress}>Undo</ItemAction>,
            })
          }
        >
          Toast
        </Button>
        <Button
          qa="ShowNotification"
          onPress={() =>
            notify({
              title: 'Deployed',
              actions: (
                <NotificationAction onPress={onPress}>View</NotificationAction>
              ),
            })
          }
        >
          Notify
        </Button>
      </>
    );
  }

  async function pressActionOverDialog(showQa: string, action: string) {
    const onPress = vi.fn();

    renderWithRoot(
      <DialogTrigger type="modal">
        <Button qa="Trigger">Open</Button>
        <Dialog>
          <Shows onPress={onPress} />
        </Dialog>
      </DialogTrigger>,
    );
    await user.click(screen.getByTestId('Trigger'));
    await screen.findByTestId('Dialog');

    await user.click(screen.getByTestId(showQa));
    await user.click(await screen.findByRole('button', { name: action }));
    await new Promise((resolve) => setTimeout(resolve, 500));

    return onPress;
  }

  it('runs a toast action and keeps the Dialog open', async () => {
    const onPress = await pressActionOverDialog('ShowToast', 'Undo');

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('Dialog')).toBeInTheDocument();
  });

  it('runs a notification action and keeps the Dialog open', async () => {
    const onPress = await pressActionOverDialog('ShowNotification', 'View');

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('Dialog')).toBeInTheDocument();
  });
});

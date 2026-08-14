import { renderWithRoot, userEvent, waitFor } from '../../../test';
import { Button } from '../../actions/Button';

import { Dialog } from './Dialog';
import { DialogTrigger } from './DialogTrigger';

vi.mock('../../../_internal/hooks/use-warn');

describe('<DialogTrigger type="popover" />', () => {
  const user = userEvent.setup({ delay: null });

  const openPopover = async (baseElement: HTMLElement) => {
    await user.click(
      baseElement.querySelector('[data-qa="Trigger"]') as HTMLElement,
    );

    return waitFor(() => {
      const dialog = baseElement.querySelector('[data-qa="Dialog"]');
      expect(dialog).toBeTruthy();
      return dialog as HTMLElement;
    });
  };

  const renderPopover = () =>
    renderWithRoot(
      <DialogTrigger type="popover">
        <Button qa="Trigger">Open</Button>
        <Dialog>
          <Button qa="Inside">Inside</Button>
        </Dialog>
      </DialogTrigger>,
    );

  it('closes on Escape right after opening', async () => {
    const { baseElement } = renderPopover();

    await openPopover(baseElement);

    // No wait: the popover has to be dismissable from the first frame, not
    // only once its enter animation has settled.
    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeNull(),
    );
  });

  it('closes on Escape once the enter animation has settled', async () => {
    const { baseElement } = renderPopover();

    await openPopover(baseElement);
    await new Promise((resolve) => setTimeout(resolve, 400));

    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeNull(),
    );
  });

  it('stays open when Escape is handled inside the popover', async () => {
    const { baseElement } = renderWithRoot(
      <DialogTrigger type="popover">
        <Button qa="Trigger">Open</Button>
        <Dialog>
          <div onKeyDown={(e) => e.stopPropagation()}>
            <Button qa="Inside">Inside</Button>
          </div>
        </Dialog>
      </DialogTrigger>,
    );

    await openPopover(baseElement);

    (baseElement.querySelector('[data-qa="Inside"]') as HTMLElement).focus();
    await user.keyboard('{Escape}');

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(baseElement.querySelector('[data-qa="Dialog"]')).toBeTruthy();
  });
});

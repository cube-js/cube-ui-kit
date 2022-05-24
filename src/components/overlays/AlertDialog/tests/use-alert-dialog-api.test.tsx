import { setTimeout } from 'node:timers/promises';
import { act } from '@testing-library/react';
import { renderWithRoot } from '../../../../test/render';
import { useAlertDialogAPI } from '../AlertDialogApiProvider';
import userEvent from '@testing-library/user-event';

describe('useAlertDialogApi', () => {
  let prevDialogPromise: Promise<string> | null = null;
  let dialogPromise: Promise<string> | null = null;
  let abortController: AbortController | null = null;

  function TestComponent() {
    const { open } = useAlertDialogAPI();

    return (
      <div
        onClick={() => {
          abortController = new AbortController();
          prevDialogPromise = dialogPromise;
          dialogPromise = null;

          dialogPromise = open(
            {
              content: <>Lorem ipsum dolor sit amet</>,
              title: 'Test Dialog',
            },
            { cancelToken: abortController.signal },
          );
        }}
      >
        Open Dialog
      </div>
    );
  }

  it('should close dialog by abort controller', async () => {
    const { getByText, getByRole } = renderWithRoot(<TestComponent />);

    const showDialogButton = getByText(/Open Dialog/);

    await act(() => userEvent.click(showDialogButton));
    await act(async () => {
      abortController?.abort();
      await setTimeout(350);
    });
    await act(() => userEvent.click(showDialogButton));

    expect(getByRole('alertdialog')).toBeInTheDocument();
  });
});

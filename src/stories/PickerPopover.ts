import { expect, userEvent, waitFor, within } from 'storybook/test';

import { waitForOverlay } from './interactions';

export async function openPickerPopover(
  canvasElement: HTMLElement,
  triggerIndex = 0,
) {
  const canvas = within(canvasElement);
  await userEvent.click((await canvas.findAllByRole('button'))[triggerIndex]);
  const dialog = await waitForOverlay('dialog');
  await waitFor(() => {
    expect(dialog).toBeVisible();
    expect(dialog).toHaveAttribute('data-type', 'popover');
  });
}

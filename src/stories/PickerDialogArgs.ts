import { expect, userEvent, waitFor, within } from 'storybook/test';

const dialogTypes = [
  'popover',
  'tray',
  'modal',
  'fullscreen',
  'fullscreenTakeover',
  'panel',
];
const dialogTypeSummary = dialogTypes.map((type) => `'${type}'`).join(' | ');

export const PICKER_DIALOG_ARGS = {
  dialogType: {
    options: dialogTypes,
    control: { type: 'select' },
    description:
      'Overlay presentation, independent of the trigger styling type.',
    table: {
      type: { summary: dialogTypeSummary },
      defaultValue: { summary: 'popover' },
    },
  },
  dialogMobileType: {
    options: [undefined, ...dialogTypes],
    control: { type: 'select' },
    description:
      'Explicit mobile overlay override. Omitted or undefined inherits dialogType.',
    table: {
      type: { summary: dialogTypeSummary },
      defaultValue: { summary: 'dialogType' },
    },
  },
} as const;

export async function openPickerDialog(
  canvasElement: HTMLElement,
  type: 'popover' | 'tray',
  triggerIndex = 0,
) {
  await userEvent.click(
    within(canvasElement).getAllByRole('button')[triggerIndex],
  );
  await waitFor(() => {
    const dialog = within(document.body).getByRole('dialog');
    expect(dialog).toBeVisible();
    expect(dialog).toHaveAttribute('data-type', type);
  });
}

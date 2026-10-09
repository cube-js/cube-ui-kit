import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { page } from 'vitest/browser';

import { pickerPopoverCases } from '../../test/picker-popover';
import { renderWithRoot } from '../../test/render';

afterEach(async () => page.viewport(1000, 800));

describe.each(pickerPopoverCases)(
  '$name mobile popover',
  ({ render, triggerIndex }) => {
    it.each([320, 390])('fits a %spx viewport', async (width) => {
      await page.viewport(width, 568);
      const view = renderWithRoot(render());
      const trigger = view.getAllByRole('button')[triggerIndex];
      await userEvent.click(trigger);
      const dialog = await screen.findByRole('dialog');

      await waitFor(() => {
        expect(dialog).toHaveAttribute('data-type', 'popover');
        const rect = dialog.getBoundingClientRect();
        expect(rect.left).toBeGreaterThanOrEqual(0);
        expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
        expect(dialog.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth + 1);
      });

      await userEvent.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
      });
    });
  },
);

describe.each(
  pickerPopoverCases.filter(
    ({ name }) => name !== 'Picker' && name !== 'FilterPicker',
  ),
)('$name short popover', ({ render, triggerIndex }) => {
  it('keeps controls reachable by scrolling', async () => {
    await page.viewport(390, 200);
    const view = renderWithRoot(render());
    await userEvent.click(view.getAllByRole('button')[triggerIndex]);
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => {
      expect(dialog).toHaveAttribute('data-type', 'popover');
      expect(dialog.getBoundingClientRect().bottom).toBeLessThanOrEqual(200);
      expect(dialog.scrollHeight).toBeGreaterThan(dialog.clientHeight);
      expect(getComputedStyle(dialog).overflowY).toBe('auto');
    });
    dialog.scrollTop = dialog.scrollHeight;
    expect(dialog.scrollTop).toBeGreaterThan(0);
    const sliders = within(dialog).queryAllByRole('slider');
    const controls = sliders.length
      ? sliders
      : within(dialog).getAllByRole('gridcell');
    const lastControl = controls[controls.length - 1];
    expect(lastControl.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      dialog.getBoundingClientRect().bottom,
    );
  });
});

import { page } from 'vitest/browser';

import { renderWithRoot, screen, userEvent, waitFor } from '../../test';
import { pickerDialogCases } from '../../test/picker-dialog';

import { Picker } from './Picker/Picker';

afterEach(async () => page.viewport(1000, 800));

describe.each(pickerDialogCases)(
  '$name on narrow screens',
  ({ render, triggerIndex }) => {
    it.each(['popover', 'tray'] as const)(
      'keeps the inherited %s inside the viewport',
      async (dialogType) => {
        await page.viewport(390, 844);
        const view = renderWithRoot(render({ dialogType }));
        await userEvent.click(view.getAllByRole('button')[triggerIndex]);
        const dialog = await screen.findByRole('dialog');

        await waitFor(() => {
          expect(dialog).toHaveAttribute('data-type', dialogType);
          const rect = dialog.getBoundingClientRect();
          expect(rect.width).toBeGreaterThan(100);
          expect(rect.left).toBeGreaterThanOrEqual(0);
          expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
          expect(dialog.scrollWidth).toBeLessThanOrEqual(
            dialog.clientWidth + 1,
          );
        });

        await userEvent.keyboard('{Escape}');
        await waitFor(() =>
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
      },
    );
  },
);

describe('Picker presentation sizing', () => {
  it.each(['popover', 'tray'] as const)(
    'preserves consumer overlay width in %s',
    async (dialogType) => {
      renderWithRoot(
        <Picker
          label="Fruit"
          width="600px"
          dialogType={dialogType}
          popoverStyles={{ width: '280px' }}
        >
          <Picker.Item key="apple">Apple</Picker.Item>
        </Picker>,
      );
      await userEvent.click(screen.getByRole('button'));
      const dialog = await screen.findByRole('dialog');
      await waitFor(() =>
        expect(parseFloat(getComputedStyle(dialog).width)).toBeCloseTo(280, 0),
      );
    },
  );
});

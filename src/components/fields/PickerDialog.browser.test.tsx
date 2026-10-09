import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { page } from 'vitest/browser';

import { pickerDialogCases } from '../../test/picker-dialog';
import { renderWithRoot } from '../../test/render';

import { Picker } from './Picker/Picker';

afterEach(async () => page.viewport(1000, 800));

describe.each(pickerDialogCases)(
  '$name on narrow screens',
  ({ render, triggerIndex }) => {
    describe.each([320, 390])('viewport width=%s', (width) => {
      it.each(['popover', 'tray'] as const)(
        'keeps the inherited %s inside the viewport',
        async (dialogType) => {
          await page.viewport(width, 568);
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
    });
  },
);

describe.each(
  pickerDialogCases.filter(
    ({ name }) => name !== 'Picker' && name !== 'FilterPicker',
  ),
)('$name on short screens', ({ render, triggerIndex }) => {
  it.each(['popover', 'tray'] as const)(
    'keeps every %s control reachable by scrolling',
    async (dialogType) => {
      await page.viewport(390, 200);
      const view = renderWithRoot(render({ dialogType }));
      await userEvent.click(view.getAllByRole('button')[triggerIndex]);
      const dialog = await screen.findByRole('dialog');

      await waitFor(() => {
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
    },
  );
});

describe('Picker presentation sizing', () => {
  it.each(
    pickerDialogCases.filter(({ name }) =>
      ['ColorPicker', 'PeriodPicker'].includes(name),
    ),
  )(
    'keeps $name tray dismissal separate from controls at 320px',
    async ({ render, triggerIndex }) => {
      await page.viewport(320, 568);
      const view = renderWithRoot(render({ dialogType: 'tray' }));
      const trigger = view.getAllByRole('button')[triggerIndex];
      await userEvent.click(trigger);
      const dialog = await screen.findByRole('dialog');
      const close = dialog.querySelector(
        '[data-qa="ModalCloseButton"]',
      ) as HTMLElement;

      await waitFor(() => {
        const rect = close.getBoundingClientRect();
        expect(
          close.contains(
            document.elementFromPoint(
              rect.left + rect.width / 2,
              rect.top + rect.height / 2,
            ),
          ),
        ).toBe(true);
      });
      await userEvent.click(close);
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
      });
    },
  );

  it.each(['popover', 'tray'] as const)(
    'preserves consumer overlay width in %s',
    async (dialogType) => {
      renderWithRoot(
        <Picker
          label="Fruit"
          // oxlint-disable-next-line tasty/consistent-token-usage -- Deliberately exceed the overlay width to catch leaked trigger sizing.
          width="600px"
          dialogType={dialogType}
          // oxlint-disable-next-line tasty/consistent-token-usage -- Assert the consumer's exact width survives default style layers.
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

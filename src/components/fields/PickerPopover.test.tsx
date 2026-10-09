import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { pickerPopoverCases } from '../../test/picker-popover';
import { renderWithRoot } from '../../test/render';

import { FilterPicker } from './FilterPicker/FilterPicker';
import { Picker } from './Picker/Picker';

vi.mock('../../_internal/hooks/use-warn');
vi.setConfig({ testTimeout: 60000 });

afterEach(() => vi.unstubAllGlobals());

describe.each(pickerPopoverCases)(
  '$name fixed popover',
  ({ render, triggerIndex }) => {
    it.each([false, true])(
      'opens and dismisses with mobile=%s',
      async (mobile) => {
        vi.stubGlobal('matchMedia', (query: string) => ({
          matches: mobile && query === '(max-width: 700px)',
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        }));

        const view = renderWithRoot(render());
        const trigger = view.getAllByRole('button')[triggerIndex];
        await userEvent.click(trigger);
        const dialog = await screen.findByRole('dialog');
        expect(dialog).toHaveAttribute('data-type', 'popover');
        expect(dialog).toHaveAccessibleName();

        await userEvent.keyboard('{Escape}');
        await waitFor(() => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
          expect(trigger).toHaveFocus();
        });
      },
    );
  },
);

describe.each([Picker, FilterPicker])(
  'picker accessible names',
  (Component) => {
    it.each([
      {
        label: <strong>Rich label</strong>,
        ariaLabel: undefined,
        expected: 'Picker',
      },
      {
        label: <strong>Rich label</strong>,
        ariaLabel: 'Fruit',
        expected: 'Fruit Picker',
      },
      { label: 0, ariaLabel: undefined, expected: '0 Picker' },
    ])('names the popup $expected', async ({ label, ariaLabel, expected }) => {
      const view = renderWithRoot(
        <Component label={label} aria-label={ariaLabel}>
          <Component.Item key="apple">Apple</Component.Item>
        </Component>,
      );
      const trigger = view.getByRole('button');
      await userEvent.click(trigger);
      const dialog = await screen.findByRole('dialog');
      expect(dialog).toHaveAccessibleName(expected);
      expect(trigger).not.toHaveAccessibleName('[object Object]');
    });
  },
);

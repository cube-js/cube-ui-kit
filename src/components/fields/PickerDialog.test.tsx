import { parseDate } from '@internationalized/date';

import {
  act,
  renderWithRoot,
  screen,
  userEvent,
  waitFor,
  within,
} from '../../test';
import { pickerDialogCases } from '../../test/picker-dialog';

import { ColorInput } from './ColorInput/ColorInput';
import { ColorPicker } from './ColorPicker/ColorPicker';
import { DatePicker } from './DatePicker/DatePicker';
import { DateRangePicker } from './DatePicker/DateRangePicker';
import { DateRangeSeparatedPicker } from './DatePicker/DateRangeSeparatedPicker';
import { PeriodPicker } from './DatePicker/PeriodPicker';
import { FilterPicker } from './FilterPicker/FilterPicker';
import { Picker } from './Picker/Picker';

import type { PresentationProps } from '../../test/picker-dialog';

vi.mock('../../_internal/hooks/use-warn');

vi.setConfig({ testTimeout: 60000 });

const presentations: {
  name: string;
  props: PresentationProps;
  desktop: string;
  mobile: string;
}[] = [
  { name: 'default', props: {}, desktop: 'popover', mobile: 'popover' },
  {
    name: 'custom popover',
    props: { dialogType: 'popover' },
    desktop: 'popover',
    mobile: 'popover',
  },
  {
    name: 'custom tray',
    props: { dialogType: 'tray' },
    desktop: 'tray',
    mobile: 'tray',
  },
  {
    name: 'undefined mobile override',
    props: { dialogType: 'tray', dialogMobileType: undefined },
    desktop: 'tray',
    mobile: 'tray',
  },
  {
    name: 'mobile tray override',
    props: { dialogType: 'popover', dialogMobileType: 'tray' },
    desktop: 'popover',
    mobile: 'tray',
  },
  {
    name: 'mobile popover override',
    props: { dialogType: 'tray', dialogMobileType: 'popover' },
    desktop: 'tray',
    mobile: 'popover',
  },
];

afterEach(() => vi.unstubAllGlobals());

describe.each(pickerDialogCases)(
  '$name dialog presentation',
  ({ render, triggerIndex }) => {
    describe.each([false, true])('mobile=%s', (mobile) => {
      it.each(presentations)(
        '$name',
        async ({ props, desktop, mobile: mobileType }) => {
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

          const view = renderWithRoot(render(props));
          const trigger = view.getAllByRole('button')[triggerIndex];
          await userEvent.click(trigger);

          const dialog = await screen.findByRole('dialog');
          expect(dialog).toHaveAttribute(
            'data-type',
            mobile ? mobileType : desktop,
          );
          expect(dialog).toHaveAccessibleName();
          expect(
            document.querySelector('[dialogtype], [dialogmobiletype]'),
          ).toBeNull();

          await userEvent.keyboard('{Escape}');
          await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
          );
          await waitFor(() => expect(trigger).toHaveFocus());
        },
      );
    });
  },
);

describe.each(['popover', 'tray'] as const)(
  'picker interactions in %s',
  (dialogType) => {
    it('selects a value independently of trigger styling', async () => {
      const onSelectionChange = vi.fn();
      renderWithRoot(
        <Picker
          label="Fruit"
          type="primary"
          dialogType={dialogType}
          onSelectionChange={onSelectionChange}
        >
          <Picker.Item key="apple">Apple</Picker.Item>
          <Picker.Item key="banana">Banana</Picker.Item>
        </Picker>,
      );
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('data-type', 'primary');
      await userEvent.click(trigger);
      await userEvent.click(
        await screen.findByRole('option', { name: 'Banana' }),
      );
      expect(onSelectionChange).toHaveBeenCalledWith('banana');
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
      expect(trigger).toHaveTextContent('Banana');
    });

    it('focuses search, filters, selects and clears search when closing', async () => {
      const onSelectionChange = vi.fn();
      const onSearchChange = vi.fn();
      renderWithRoot(
        <FilterPicker
          label="Fruit"
          dialogType={dialogType}
          onSelectionChange={onSelectionChange}
          onSearchChange={onSearchChange}
        >
          <FilterPicker.Item key="apple">Apple</FilterPicker.Item>
          <FilterPicker.Item key="banana">Banana</FilterPicker.Item>
        </FilterPicker>,
      );
      const trigger = screen.getByRole('button');
      await userEvent.click(trigger);
      const search = await screen.findByRole('combobox');
      await waitFor(() => expect(search).toHaveFocus());
      await userEvent.type(search, 'Ban');
      await waitFor(() =>
        expect(screen.getAllByRole('option')).toHaveLength(1),
      );
      await userEvent.keyboard('{ArrowDown}{Enter}');
      await waitFor(() =>
        expect(onSelectionChange).toHaveBeenCalledWith('banana'),
      );
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
      expect(onSearchChange).toHaveBeenLastCalledWith('');
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    it('selects a date and closes the calendar', async () => {
      const onChange = vi.fn();
      renderWithRoot(
        <DatePicker
          label="Date"
          dialogType={dialogType}
          defaultValue={parseDate('2026-10-09')}
          onChange={onChange}
        />,
      );
      await userEvent.click(screen.getByRole('button'));
      const dialog = await screen.findByRole('dialog');
      await userEvent.click(
        within(dialog).getByRole('button', { name: /October 10/i }),
      );
      expect(onChange.mock.calls[0][0].toString()).toBe('2026-10-10');
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
    });

    it('selects a range in one calendar', async () => {
      const onChange = vi.fn();
      renderWithRoot(
        <DateRangePicker
          label="Dates"
          dialogType={dialogType}
          placeholderValue={parseDate('2026-10-01')}
          onChange={onChange}
        />,
      );
      await userEvent.click(screen.getByRole('button'));
      const dialog = await screen.findByRole('dialog');
      await userEvent.click(
        within(dialog).getByRole('button', { name: /October 10/i }),
      );
      await userEvent.click(
        within(dialog).getByRole('button', { name: /October 20/i }),
      );
      expect(onChange.mock.calls[0][0].start.toString()).toBe('2026-10-10');
      expect(onChange.mock.calls[0][0].end.toString()).toBe('2026-10-20');
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
    });

    it('selects both separated range endpoints', async () => {
      const onChange = vi.fn();
      const view = renderWithRoot(
        <DateRangeSeparatedPicker
          label="Dates"
          dialogType={dialogType}
          placeholderValue={parseDate('2026-10-01')}
          onChange={onChange}
        />,
      );
      for (const [index, day] of [
        [0, 10],
        [1, 20],
      ]) {
        await userEvent.click(view.getAllByRole('button')[index]);
        const dialog = await screen.findByRole('dialog');
        await userEvent.click(
          within(dialog).getByRole('button', {
            name: new RegExp(`October ${day}`),
          }),
        );
        await waitFor(() =>
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
      }
      expect(onChange.mock.calls[0][0].start.toString()).toBe('2026-10-10');
      expect(onChange.mock.calls[0][0].end.toString()).toBe('2026-10-20');
    });

    it('snaps a selected month to its first day', async () => {
      const onChange = vi.fn();
      renderWithRoot(
        <PeriodPicker
          label="Month"
          dialogType={dialogType}
          defaultValue={parseDate('2026-10-09')}
          onChange={onChange}
        />,
      );
      await userEvent.click(screen.getByRole('button'));
      const dialog = await screen.findByRole('dialog');
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Nov' }),
      );
      expect(onChange.mock.calls[0][0].toString()).toBe('2026-11-01');
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
    });

    it.each([ColorPicker, ColorInput])(
      'changes color through a focused channel',
      async (Component) => {
        const onChange = vi.fn();
        renderWithRoot(
          <Component
            label="Color"
            dialogType={dialogType}
            defaultValue="#ff0000"
            defaultSpace="rgb"
            onChange={onChange}
          />,
        );
        await userEvent.click(screen.getByRole('button'));
        const dialog = await screen.findByRole('dialog');
        const slider = within(dialog).getAllByRole('slider')[1];
        await act(async () => slider.focus());
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(onChange).toHaveBeenCalled());
        expect(onChange.mock.calls.at(-1)[0]).not.toBe('#ff0000');
      },
    );
  },
);

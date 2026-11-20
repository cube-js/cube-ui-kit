import { CalendarDate, Time } from '@internationalized/date';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithRoot } from '../../../../test/render';
import { Checkbox } from '../../../fields/Checkbox/Checkbox';
import { CheckboxGroup } from '../../../fields/Checkbox/CheckboxGroup';
import { ComboBox } from '../../../fields/ComboBox/ComboBox';
import { DateInput } from '../../../fields/DatePicker/DateInput';
import { TimeInput } from '../../../fields/DatePicker/TimeInput';
import { FileInput } from '../../../fields/FileInput/FileInput';
import { NumberInput } from '../../../fields/NumberInput/NumberInput';
import { Radio } from '../../../fields/RadioGroup/Radio';
import { RadioGroup } from '../../../fields/RadioGroup/RadioGroup';
import { Select } from '../../../fields/Select/Select';
import { Switch } from '../../../fields/Switch/Switch';
import { TextInput } from '../../../fields/TextInput/TextInput';
import { Form } from '../index';

import { createFormController } from './controller';

import type { ReactNode } from 'react';
import type { FieldBaseProps } from '../../../../shared/form';
import type { CubeFormInstance } from '../use-form';

type Binding = 'legacy' | 'tuple name' | 'descriptor';
type BoundProps = Pick<FieldBaseProps<any>, 'name' | 'field'>;

// Exercise the same UI workflow through each public binding, including the
// legacy dot-path payload contract. Keep actual input adapters in the loop.
function renderWorkflow(
  binding: Binding,
  profile: Record<string, unknown>,
  children: (bind: (key: string) => BoundProps) => ReactNode,
) {
  const onSubmit = vi.fn();
  const onValuesChange = vi.fn();
  const modern = createFormController({ defaultValues: { profile } });
  let legacy!: CubeFormInstance<Record<string, unknown>>;
  const bind = (key: string): BoundProps =>
    binding === 'legacy'
      ? { name: `profile.${key}` }
      : binding === 'tuple name'
        ? { name: ['profile', key] }
        : { field: modern.field(['profile', key]) };
  const content = (
    <>
      {children(bind)}
      <Form.Submit>Save</Form.Submit>
      <Form.Reset>Reset</Form.Reset>
    </>
  );
  function Legacy() {
    [legacy] = Form.useForm();
    return (
      <Form
        form={legacy}
        defaultValues={{ profile }}
        onSubmit={onSubmit}
        onValuesChange={onValuesChange}
      >
        {content}
      </Form>
    );
  }
  const view = renderWithRoot(
    binding === 'legacy' ? (
      <Legacy />
    ) : (
      <Form form={modern} onSubmit={onSubmit} onValuesChange={onValuesChange}>
        {content}
      </Form>
    ),
  );
  return {
    ...view,
    modern,
    onSubmit,
    onValuesChange,
    values: () =>
      binding === 'legacy' ? legacy.getFormData() : modern.getActiveValues(),
    set: (key: string, value: unknown) =>
      binding === 'legacy'
        ? legacy.setFieldValue(`profile.${key}`, value)
        : modern.setValue(['profile', key], value),
  };
}

describe.each<Binding>(['legacy', 'tuple name', 'descriptor'])(
  '%s input workflows',
  (binding) => {
    it('submits numeric and boolean edits once and restores their displayed defaults', async () => {
      const changes = vi.fn();
      const defaults = { count: 3, enabled: false, confirmed: false };
      const view = renderWorkflow(binding, defaults, (bind) => (
        <>
          <NumberInput {...bind('count')} label="Count" onChange={changes} />
          <Switch {...bind('enabled')} label="Enabled" />
          <Checkbox {...bind('confirmed')} label="Confirmed" />
        </>
      ));
      const count = view.getByRole('textbox', { name: 'Count' });
      const enabled = view.getByRole('switch', { name: 'Enabled' });
      const confirmed = view.getByRole('checkbox', { name: 'Confirmed' });
      expect(view.values()).toEqual({ profile: defaults });
      await userEvent.clear(count);
      await userEvent.type(count, '7');
      await userEvent.tab();
      expect(changes.mock.calls.filter(([value]) => value === 7)).toHaveLength(
        1,
      );
      await userEvent.click(enabled);
      await userEvent.click(confirmed);
      await userEvent.click(view.getByRole('button', { name: 'Save' }));
      await waitFor(() => expect(view.onSubmit).toHaveBeenCalledTimes(1));
      expect(view.onSubmit.mock.calls[0][0]).toEqual({
        profile: { count: 7, enabled: true, confirmed: true },
      });
      await userEvent.click(view.getByRole('button', { name: 'Reset' }));
      await waitFor(() => expect(count).toHaveValue('3'));
      expect(enabled).not.toBeChecked();
      expect(confirmed).not.toBeChecked();
      expect(view.values()).toEqual({ profile: defaults });
    });

    it('keeps group options detached while selections round-trip through submit and reset', async () => {
      const defaults = { pick: 'a', radio: 'a', checks: ['a'] };
      const view = renderWorkflow(binding, defaults, (bind) => (
        <>
          <Select {...bind('pick')} label="Pick">
            <Select.Item key="a">Alpha</Select.Item>
            <Select.Item key="b">Beta</Select.Item>
          </Select>
          <RadioGroup {...bind('radio')} label="Radio">
            <Radio value="a" name="option-a">
              First
            </Radio>
            <Radio value="b" name="option-b">
              Second
            </Radio>
          </RadioGroup>
          <CheckboxGroup {...bind('checks')} label="Checks">
            <Checkbox value="a" name="check-a">
              One
            </Checkbox>
            <Checkbox value="b" name="check-b">
              Two
            </Checkbox>
          </CheckboxGroup>
        </>
      ));
      await userEvent.click(view.getByRole('button', { name: /Pick/ }));
      await userEvent.click(
        await screen.findByRole('option', { name: 'Beta' }),
      );
      await userEvent.click(view.getByRole('radio', { name: 'Second' }));
      await userEvent.click(view.getByRole('checkbox', { name: 'Two' }));
      expect(view.values()).toEqual({
        profile: { pick: 'b', radio: 'b', checks: ['a', 'b'] },
      });
      await userEvent.click(view.getByRole('button', { name: 'Save' }));
      await waitFor(() => expect(view.onSubmit).toHaveBeenCalledTimes(1));
      expect(view.onSubmit.mock.calls[0][0]).toEqual(view.values());
      await userEvent.click(view.getByRole('button', { name: 'Reset' }));
      await waitFor(() => expect(view.values()).toEqual({ profile: defaults }));
      expect(view.getByRole('radio', { name: 'First' })).toBeChecked();
      expect(view.getByRole('radio', { name: 'Second' })).not.toBeChecked();
      expect(view.getByRole('checkbox', { name: 'One' })).toBeChecked();
      expect(view.getByRole('checkbox', { name: 'Two' })).not.toBeChecked();
      expect(view.getByRole('button', { name: /Pick/ })).toHaveTextContent(
        'Alpha',
      );
    });

    it.each(['', 'known'])(
      'commits custom combobox text over %j before the same Enter submits',
      async (initial) => {
        const view = renderWorkflow(binding, { tag: initial }, (bind) => (
          <ComboBox {...bind('tag')} label="Tag" allowsCustomValue>
            <ComboBox.Item key="known">Known</ComboBox.Item>
          </ComboBox>
        ));
        const input = view.getByRole('combobox', { name: 'Tag' });
        await userEvent.type(input, 'Custom', {
          initialSelectionStart: 0,
          initialSelectionEnd: (input as HTMLInputElement).value.length,
        });
        await waitFor(() =>
          expect(input).toHaveAttribute('aria-expanded', 'false'),
        );
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(view.onSubmit).toHaveBeenCalledTimes(1));
        expect(view.onSubmit.mock.calls[0][0]).toEqual({
          profile: { tag: 'Custom' },
        });
        expect(view.values()).toEqual({ profile: { tag: 'Custom' } });
        await userEvent.click(view.getByRole('button', { name: 'Reset' }));
        await waitFor(() => expect(input).toHaveValue(initial ? 'Known' : ''));
      },
    );

    it('round-trips date and time objects through keyboard edits and programmatic writes', async () => {
      const date = new CalendarDate(2026, 9, 21);
      const time = new Time(10, 30);
      const view = renderWorkflow(binding, { date, time }, (bind) => (
        <>
          <DateInput {...bind('date')} label="Date" />
          <TimeInput {...bind('time')} label="Time" hourCycle={24} />
        </>
      ));
      const dateGroup = view.getByRole('group', { name: 'Date' });
      const day = within(dateGroup).getByRole('spinbutton', { name: /day/i });
      await userEvent.click(day);
      await userEvent.keyboard('{ArrowUp}');
      const timeGroup = view.getByRole('group', { name: 'Time' });
      const hour = within(timeGroup).getByRole('spinbutton', { name: /hour/i });
      await userEvent.click(hour);
      await userEvent.keyboard('{ArrowUp}');
      await userEvent.click(view.getByRole('button', { name: 'Save' }));
      await waitFor(() => expect(view.onSubmit).toHaveBeenCalledTimes(1));
      const submitted = view.onSubmit.mock.calls[0][0].profile;
      expect(submitted.date).toBeInstanceOf(CalendarDate);
      expect(submitted.date.toString()).toBe('2026-09-22');
      expect(submitted.time).toBeInstanceOf(Time);
      expect(submitted.time.toString()).toBe('11:30:00');
      act(() => view.set('date', new CalendarDate(2026, 10, 5)));
      expect(day).toHaveAttribute('aria-valuenow', '5');
      await userEvent.click(view.getByRole('button', { name: 'Reset' }));
      await waitFor(() => expect(day).toHaveAttribute('aria-valuenow', '21'));
      expect(hour).toHaveAttribute('aria-valuenow', '10');
    });

    it.each(['file', 'text'] as const)(
      'clears a %s upload and its filename when the form resets',
      async (type) => {
        const view = renderWorkflow(binding, { file: '' }, (bind) => (
          <FileInput {...bind('file')} label="Attachment" type={type} />
        ));
        const input = view.getByLabelText('Attachment', {
          selector: 'input',
        }) as HTMLInputElement;
        const file = new File(['report'], 'report.txt', { type: 'text/plain' });
        await userEvent.upload(input, file);
        await waitFor(() =>
          expect(view.getByText('report.txt')).toBeInTheDocument(),
        );
        expect(input.files).toHaveLength(1);
        await userEvent.click(view.getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(view.onSubmit).toHaveBeenCalledTimes(1));
        expect(view.onSubmit.mock.calls[0][0].profile.file).toContain(
          type === 'file' ? 'report.txt' : 'report',
        );
        await userEvent.click(view.getByRole('button', { name: 'Reset' }));
        await waitFor(() =>
          expect(view.values()).toEqual({ profile: { file: '' } }),
        );
        expect(view.queryByText('report.txt')).not.toBeInTheDocument();
        expect(input.files).toHaveLength(0);
        // Selecting the same file again must still produce a change event.
        await userEvent.upload(input, file);
        await waitFor(() =>
          expect(view.values()).toMatchObject({
            profile: {
              file: expect.stringContaining(
                type === 'file' ? 'report.txt' : 'report',
              ),
            },
          }),
        );
      },
    );

    it('keeps disabled controls inert while accepting programmatic updates', async () => {
      const view = renderWorkflow(
        binding,
        { name: 'Ada', enabled: false },
        (bind) => (
          <>
            <TextInput {...bind('name')} label="Name" isReadOnly />
            <Switch {...bind('enabled')} label="Enabled" isDisabled />
          </>
        ),
      );
      await userEvent.type(view.getByRole('textbox', { name: 'Name' }), '!');
      await userEvent.click(view.getByRole('switch', { name: 'Enabled' }));
      expect(view.onValuesChange).not.toHaveBeenCalled();
      act(() => {
        view.set('name', 'Grace');
        view.set('enabled', true);
      });
      expect(view.getByRole('textbox', { name: 'Name' })).toHaveValue('Grace');
      expect(view.getByRole('switch', { name: 'Enabled' })).toBeChecked();
      expect(view.onValuesChange).not.toHaveBeenCalled();
    });
  },
);

// A cleared NumberInput reports `NaN`. A modern form stores `null`, its empty
// value, so only `required` judges the field. The legacy form keeps `NaN`.
describe.each<Binding>(['tuple name', 'descriptor'])(
  '%s cleared number',
  (binding) => {
    const wholeDollars = { type: 'integer', message: 'Whole dollars' } as const;

    it('stores and submits a cleared optional number as null without running its type rule', async () => {
      const seen: unknown[] = [];
      const validated: unknown[] = [];
      const changes = vi.fn();
      const view = renderWorkflow(binding, { count: 3 }, (bind) => (
        <NumberInput
          {...bind('count')}
          label="Count"
          rules={[
            wholeDollars,
            {
              validator: async (_rule, value) => {
                validated.push(value);
              },
            },
          ]}
          shouldUpdate={(_previous, next: any) => {
            seen.push(next.profile.count);
            return true;
          }}
          onChange={changes}
        />
      ));
      const count = view.getByRole('textbox', { name: 'Count' });
      await userEvent.clear(count);
      await userEvent.tab();
      expect(view.values()).toEqual({ profile: { count: null } });
      expect(seen).toEqual([null]);
      // The input's own `onChange` still gets React Aria's `NaN`.
      expect(changes).toHaveBeenLastCalledWith(NaN);
      expect(validated.at(-1)).toBeNull();
      expect(view.onValuesChange.mock.lastCall?.[0]).toEqual({
        profile: { count: null },
      });
      expect(count).toHaveValue('');
      await userEvent.click(view.getByRole('button', { name: 'Save' }));
      await waitFor(() => expect(view.onSubmit).toHaveBeenCalledTimes(1));
      expect(view.onSubmit.mock.calls[0][0]).toEqual({
        profile: { count: null },
      });
      expect(view.queryByText('Whole dollars')).not.toBeInTheDocument();
    });

    it('lets required speak for a cleared required number', async () => {
      const view = renderWorkflow(binding, { count: 3 }, (bind) => (
        <NumberInput
          {...bind('count')}
          label="Count"
          // The type rule first: on a cleared field it must not get a say.
          rules={[wholeDollars, { required: true, message: 'Enter a count' }]}
        />
      ));
      await userEvent.clear(view.getByRole('textbox', { name: 'Count' }));
      await userEvent.click(view.getByRole('button', { name: 'Save' }));
      expect(await view.findByText('Enter a count')).toBeInTheDocument();
      expect(view.queryByText('Whole dollars')).not.toBeInTheDocument();
      expect(view.onSubmit).not.toHaveBeenCalled();
    });

    it('lets isRequired speak for a cleared number', async () => {
      const view = renderWorkflow(binding, { count: 3 }, (bind) => (
        <NumberInput
          {...bind('count')}
          isRequired
          label="Count"
          rules={[wholeDollars]}
        />
      ));
      await userEvent.clear(view.getByRole('textbox', { name: 'Count' }));
      await userEvent.click(view.getByRole('button', { name: 'Save' }));
      await waitFor(() =>
        expect(
          view.modern.getSnapshot().fields['profile.count']?.errors,
        ).toHaveLength(1),
      );
      expect(view.queryByText('Whole dollars')).not.toBeInTheDocument();
      expect(view.onSubmit).not.toHaveBeenCalled();
    });

    it('is not dirty after a number is typed and cleared back to a null default', async () => {
      const view = renderWorkflow(binding, { count: null }, (bind) => (
        <NumberInput {...bind('count')} label="Count" />
      ));
      const count = view.getByRole('textbox', { name: 'Count' });
      await userEvent.type(count, '5');
      await userEvent.tab();
      expect(view.modern.getSnapshot().isDirty).toBe(true);
      await userEvent.clear(count);
      await userEvent.tab();
      expect(view.modern.getSnapshot().isDirty).toBe(false);
    });

    it('still checks a NaN that code sets', async () => {
      const view = renderWorkflow(binding, { count: 3 }, (bind) => (
        <NumberInput {...bind('count')} label="Count" rules={[wholeDollars]} />
      ));
      act(() => view.set('count', NaN));
      await userEvent.click(view.getByRole('button', { name: 'Save' }));
      expect(await view.findByText('Whole dollars')).toBeInTheDocument();
      expect(view.onSubmit).not.toHaveBeenCalled();
    });
  },
);

it('keeps NaN for a cleared number in the legacy form', async () => {
  const view = renderWorkflow('legacy', { count: 3 }, (bind) => (
    <NumberInput {...bind('count')} label="Count" />
  ));
  await userEvent.clear(view.getByRole('textbox', { name: 'Count' }));
  await userEvent.tab();
  expect(view.values()).toEqual({ profile: { count: NaN } });
});

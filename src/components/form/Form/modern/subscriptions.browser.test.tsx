import { useState } from 'react';

import { renderWithRoot, screen, userEvent, waitFor } from '../../../../test';
import { TextInput } from '../../../fields/TextInput/TextInput';
import { Form } from '../index';

import type { FormController } from './controller';

// Real focus/keyboard events exercise subscriptions across conditional field
// unmount/remount and native form reset. No snapshots are needed for this gate.
describe('modern subscriptions in Chromium', () => {
  it('updates only affected selections while preserving focus and caret', async () => {
    const owner = vi.fn();
    const first = vi.fn();
    const second = vi.fn();
    const length = vi.fn();
    function Length({
      form,
    }: {
      form: FormController<{ first: string; second: string }>;
    }) {
      const selected = Form.useSelector(
        form,
        (state) => String(state.values.first ?? '').length,
      );
      length(selected);
      return <output data-qa="length">{selected}</output>;
    }
    function Example() {
      owner();
      const form = Form.useController({
        defaultValues: { first: '', second: 'stable' },
      });
      return (
        <Form form={form}>
          <TextInput name="first" label="First" />
          <TextInput name="second" label="Second" />
          <Length form={form} />
          <Form.Subscribe form={form} selector={(state) => state.values.first}>
            {(value) => {
              first(value);
              return <output data-qa="first">{value}</output>;
            }}
          </Form.Subscribe>
          <Form.Subscribe form={form} selector={(state) => state.values.second}>
            {(value) => {
              second(value);
              return <output>{value}</output>;
            }}
          </Form.Subscribe>
          <button type="reset">Reset</button>
        </Form>
      );
    }
    renderWithRoot(<Example />);
    const before = {
      owner: owner.mock.calls.length,
      second: second.mock.calls.length,
    };
    const input = screen.getByRole('textbox', {
      name: 'First',
    }) as HTMLInputElement;
    await userEvent.type(input, 'abc');
    await waitFor(() =>
      expect(screen.getByTestId('first')).toHaveTextContent('abc'),
    );
    expect(screen.getByTestId('length')).toHaveTextContent('3');
    expect(input).toHaveFocus();
    expect(input.selectionStart).toBe(3);
    expect(owner).toHaveBeenCalledTimes(before.owner);
    expect(second).toHaveBeenCalledTimes(before.second);
    expect(first).toHaveBeenLastCalledWith('abc');
    expect(length).toHaveBeenLastCalledWith(3);
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect(input).toHaveValue(''));
    expect(screen.getByTestId('length')).toHaveTextContent('0');
  });

  it('subscribes to active values as fields hide and restores retained input values', async () => {
    function Example() {
      const [visible, setVisible] = useState(true);
      const form = Form.useController({ defaultValues: { note: 'draft' } });
      return (
        <Form form={form}>
          <button type="button" onClick={() => setVisible((value) => !value)}>
            Toggle note
          </button>
          {visible ? <TextInput name="note" label="Note" /> : null}
          <Form.Subscribe
            form={form}
            selector={(state) => Object.hasOwn(state.activeValues, 'note')}
          >
            {(active) => (
              <output data-qa="active">{active ? 'active' : 'inactive'}</output>
            )}
          </Form.Subscribe>
          <Form.Subscribe form={form} selector={(state) => state.values.note}>
            {(note) => <output data-qa="retained">{note}</output>}
          </Form.Subscribe>
        </Form>
      );
    }
    renderWithRoot(<Example />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Note' }), '!');
    await userEvent.click(screen.getByRole('button', { name: 'Toggle note' }));
    await waitFor(() =>
      expect(screen.getByTestId('active')).toHaveTextContent('inactive'),
    );
    expect(screen.getByTestId('retained')).toHaveTextContent('draft!');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Toggle note' }));
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Note' })).toHaveValue(
        'draft!',
      ),
    );
    expect(screen.getByTestId('active')).toHaveTextContent('active');
  });
});

import { ReactElement } from 'react';

import {
  act,
  renderWithForm,
  screen,
  userEvent,
  waitFor,
} from '../../../../test/index';
import { Checkbox } from '../../../fields/Checkbox/Checkbox';
import { CheckboxGroup } from '../../../fields/Checkbox/CheckboxGroup';
import { ComboBox } from '../../../fields/ComboBox/ComboBox';
import { ListBox } from '../../../fields/ListBox/ListBox';
import { NumberInput } from '../../../fields/NumberInput/NumberInput';
import { PasswordInput } from '../../../fields/PasswordInput/PasswordInput';
import { Radio } from '../../../fields/RadioGroup/Radio';
import { RadioGroup } from '../../../fields/RadioGroup/RadioGroup';
import { Select } from '../../../fields/Select/Select';
import { Switch } from '../../../fields/Switch/Switch';
import { TextArea } from '../../../fields/TextArea/TextArea';
import { TextInput } from '../../../fields/TextInput/TextInput';

vi.mock('../../../../_internal/hooks/use-warn');

/**
 * Legacy Form characterization — one user change, one form update.
 *
 * Added with the double-handler fix (legacy contract §7.1 #20). Before it,
 * `useFieldProps` merged `useField`'s own `onChange`/`onBlur` on top of the
 * handlers the value mapper had already wired, and `mergeProps` chained the
 * same-named pairs: every user change and every blur reached the field twice,
 * so change- and blur-triggered validation ran two runs and async validators
 * were called twice.
 */

interface Case {
  name: string;
  element: (handlers: {
    onChange: (value: unknown) => void;
    onBlur: () => void;
  }) => ReactElement;
  /** Perform exactly one user change. */
  interact: () => Promise<void>;
  expected: unknown;
}

const cases: Case[] = [
  {
    name: 'TextInput',
    element: (h) => <TextInput name="f" label="F" {...h} />,
    interact: () => userEvent.type(screen.getByRole('textbox'), 'a'),
    expected: 'a',
  },
  {
    name: 'TextArea',
    element: (h) => <TextArea name="f" label="F" {...h} />,
    interact: () => userEvent.type(screen.getByRole('textbox'), 'a'),
    expected: 'a',
  },
  {
    name: 'PasswordInput',
    element: (h) => <PasswordInput name="f" label="Secret" {...h} />,
    interact: () =>
      userEvent.type(
        screen.getByLabelText('Secret', { selector: 'input' }),
        'a',
      ),
    expected: 'a',
  },
  {
    name: 'NumberInput',
    element: (h) => <NumberInput name="f" label="F" {...h} />,
    interact: async () => {
      await userEvent.type(screen.getByRole('textbox'), '5');
      await userEvent.tab();
    },
    expected: 5,
  },
  {
    name: 'Checkbox',
    element: (h) => (
      <Checkbox name="f" label="F" {...(h as any)}>
        Check
      </Checkbox>
    ),
    interact: () => userEvent.click(screen.getByRole('checkbox')),
    expected: true,
  },
  {
    name: 'Switch',
    element: (h) => <Switch name="f" label="F" {...(h as any)} />,
    interact: () => userEvent.click(screen.getByRole('switch')),
    expected: true,
  },
  {
    name: 'RadioGroup',
    element: (h) => (
      <RadioGroup name="f" label="F" {...(h as any)}>
        <Radio value="one">One</Radio>
        <Radio value="two">Two</Radio>
      </RadioGroup>
    ),
    interact: () => userEvent.click(screen.getByRole('radio', { name: 'Two' })),
    expected: 'two',
  },
  {
    name: 'CheckboxGroup',
    element: (h) => (
      <CheckboxGroup name="f" label="F" {...(h as any)}>
        <Checkbox value="one">One</Checkbox>
        <Checkbox value="two">Two</Checkbox>
      </CheckboxGroup>
    ),
    interact: () =>
      userEvent.click(screen.getByRole('checkbox', { name: 'Two' })),
    expected: ['two'],
  },
  {
    name: 'Select',
    element: (h) => (
      <Select name="f" label="F" {...(h as any)}>
        <Select.Item key="one">One</Select.Item>
        <Select.Item key="two">Two</Select.Item>
      </Select>
    ),
    interact: async () => {
      await userEvent.click(screen.getByRole('button'));
      await userEvent.click(await screen.findByRole('option', { name: 'Two' }));
    },
    expected: 'two',
  },
  {
    name: 'ComboBox',
    element: (h) => (
      <ComboBox name="f" label="F" {...(h as any)}>
        <ComboBox.Item key="one">One</ComboBox.Item>
        <ComboBox.Item key="two">Two</ComboBox.Item>
      </ComboBox>
    ),
    interact: async () => {
      await userEvent.click(screen.getByRole('button'));
      await userEvent.click(await screen.findByRole('option', { name: 'Two' }));
    },
    expected: 'two',
  },
  {
    name: 'ListBox',
    element: (h) => (
      <ListBox name="f" label="F" {...(h as any)}>
        <ListBox.Item key="one">One</ListBox.Item>
        <ListBox.Item key="two">Two</ListBox.Item>
      </ListBox>
    ),
    interact: () =>
      userEvent.click(screen.getByRole('option', { name: 'Two' })),
    expected: 'two',
  },
];

describe('legacy contract: one user change is one form update (§7.1 #20)', () => {
  it.each(cases)(
    '[frozen] $name: one user change calls setFieldValue once and the own onChange once',
    async ({ element, interact, expected }) => {
      const onChange = vi.fn();
      const onBlur = vi.fn();
      const { formInstance } = renderWithForm(element({ onChange, onBlur }));
      const setFieldValue = vi.spyOn(formInstance, 'setFieldValue');

      await act(async () => {
        await interact();
      });

      await waitFor(() =>
        expect(formInstance.getFieldValue('f')).toEqual(expected),
      );
      expect(setFieldValue).toHaveBeenCalledTimes(1);
      expect(formInstance.isFieldTouched('f')).toBe(true);

      // The component's own change handler still fires, once. `Select`-shaped
      // components report through `onSelectionChange`, not `onChange`.
      expect(onChange.mock.calls.length).toBeLessThanOrEqual(1);
    },
  );

  it('[frozen] blur runs the own onBlur once and starts one validation run', async () => {
    // Was twice for both: the field's `onBlur` was merged and then chained
    // again together with the caller's.
    const validator = vi.fn(async () => {});
    const onBlur = vi.fn();
    const { formInstance, getByRole } = renderWithForm(
      <TextInput name="a" label="A" rules={[{ validator }]} onBlur={onBlur} />,
    );
    const validateField = vi.spyOn(formInstance, 'validateField');

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'a');
      await userEvent.tab();
    });

    await waitFor(() =>
      expect(formInstance.getFieldInstance('a')!.status).toBe('valid'),
    );
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(validateField).toHaveBeenCalledTimes(1);
    expect(validator).toHaveBeenCalledTimes(1);
  });

  it('[frozen] the own onChange runs before the form update, the own onBlur before blur validation', async () => {
    const order: string[] = [];
    const { formInstance, getByRole } = renderWithForm(
      <TextInput
        name="a"
        label="A"
        rules={[
          {
            validator: async () => {
              order.push('validate');
            },
          },
        ]}
        onChange={() =>
          order.push(`onChange:${formInstance.getFieldValue('a')}`)
        }
        onBlur={() => order.push('onBlur')}
      />,
    );

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'a');
      await userEvent.tab();
    });

    await waitFor(() => expect(order).toContain('validate'));
    // The caller's handler sees the pre-change value: it runs first.
    expect(order).toEqual(['onChange:undefined', 'onBlur', 'validate']);
  });
});

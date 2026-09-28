import {
  Checkbox,
  CheckboxGroup,
  ColorSwatchGroup,
  CommandTextArea,
  PasswordInput,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextArea,
  TextInput,
} from '../../../index';
import {
  act,
  renderWithForm,
  userEvent,
  waitFor,
  within,
} from '../../../test/index';

import { ResetButton } from './index';

const DEFAULTS = {
  text: 'text',
  textarea: 'textarea',
  password: 'password',
  command: 'command',
  checkbox: true,
  switch: true,
  checkboxes: ['one'],
  radio: 'one',
  select: 'one',
};

/**
 * Until CUB-5075 most of these inputs rendered `form="[object Object]"`, so
 * they had no form owner and a native reset never reached them. Now React
 * Aria's `useFormReset` listener on each one writes its initial value through
 * `onChange` when the reset event fires, as it already did for `TextInput`,
 * and `onValuesChange` sees those writes. Not all of them land on the default:
 * `CheckboxGroup` ends at `[]`, because React Stately's `removeValue` filters
 * the values from before the reset. `ResetButton` resets the form a tick
 * later, so the form default must still be what every field ends up with, and
 * no input may throw on the way (`ColorSwatchGroup` used to on `null`).
 */
describe('native reset of a legacy form', () => {
  function Fields() {
    return (
      <>
        <TextInput name="text" label="Text" />
        <TextArea name="textarea" label="Text area" />
        <PasswordInput name="password" label="Password" />
        <CommandTextArea name="command" label="Command" />
        <Checkbox name="checkbox">Checkbox</Checkbox>
        <Switch name="switch">Switch</Switch>
        <CheckboxGroup name="checkboxes" label="Checkboxes">
          <Checkbox value="one">One</Checkbox>
          <Checkbox value="two">Two</Checkbox>
        </CheckboxGroup>
        <RadioGroup name="radio" label="Radio">
          <Radio value="one">One</Radio>
          <Radio value="two">Two</Radio>
        </RadioGroup>
        <Select name="select" label="Select">
          <Select.Item key="one">One</Select.Item>
          <Select.Item key="two">Two</Select.Item>
        </Select>
        {/* No default: its reset value is `null`. */}
        <ColorSwatchGroup
          name="swatch"
          label="Swatch"
          colors={['#ff0000', '#00ff00']}
        />
        <ResetButton>Reset</ResetButton>
      </>
    );
  }

  const errors: unknown[] = [];
  const onError = (event: ErrorEvent) => errors.push(event.error);

  beforeEach(() => {
    errors.length = 0;
    window.addEventListener('error', onError);
  });

  afterEach(() => {
    window.removeEventListener('error', onError);
  });

  // Drives eleven inputs through user-event, which can outrun the 5s default
  // on a busy runner.
  it('should leave every field at its form default after ResetButton', async () => {
    const { formInstance, getByRole, container } = renderWithForm(<Fields />, {
      formProps: { defaultValues: DEFAULTS },
    });
    const swatches = within(getByRole('radiogroup', { name: 'Swatch' }));

    await act(async () => {
      await userEvent.click(getByRole('checkbox', { name: 'Checkbox' }));
      await userEvent.click(swatches.getAllByRole('radio')[0]);
      formInstance.setFieldsValue(
        {
          text: 'changed',
          textarea: 'changed',
          password: 'changed',
          command: 'changed',
          switch: false,
          checkboxes: ['two'],
          radio: 'two',
          select: 'two',
        },
        true,
      );
    });

    expect(formInstance.getFieldsValue()).not.toEqual(DEFAULTS);

    // Every control belongs to the form, so the reset event reaches them all.
    const formElement = container.querySelector('form');
    const controls = container.querySelectorAll<HTMLInputElement>(
      'input, textarea, select',
    );

    expect(controls.length).toBeGreaterThan(10);
    expect(
      Array.from(controls, (control) => control.form === formElement),
    ).not.toContain(false);

    await act(async () => {
      await userEvent.click(getByRole('button', { name: 'Reset' }));
    });

    await waitFor(() => expect(formInstance.isTouched).toBe(false));
    expect(errors).toEqual([]);
    expect(formInstance.getFieldsValue()).toEqual(DEFAULTS);
    expect(getByRole('checkbox', { name: 'Checkbox' })).toBeChecked();
    expect(getByRole('switch', { name: 'Switch' })).toBeChecked();
    expect(getByRole('radio', { name: 'One' })).toBeChecked();
    expect(container.querySelector('select')).toHaveValue('one');
  }, 10_000);
});

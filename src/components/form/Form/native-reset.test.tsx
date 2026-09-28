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

const CHANGED = {
  text: 'changed',
  textarea: 'changed',
  password: 'changed',
  command: 'changed',
  switch: false,
  checkboxes: ['two'],
  radio: 'two',
  select: 'two',
};

/**
 * Until CUB-5075 most of these inputs rendered `form="[object Object]"`, so
 * they had no form owner and a native reset never reached them. With a form
 * owner, React Aria's `useFormReset` listener on each input would write the
 * value it started with through `onChange` on every native reset, and ignore
 * `preventDefault`. A `CheckboxGroup` lands on `[]` that way, because React
 * Stately's `removeValue` filters the values from before the event. The legacy
 * root now resets the form once, in capture, before those listeners run, and
 * reports the reset values to `onValuesChange`.
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
        {/* No default: React Aria's reset value for it is `null`. */}
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

  async function renderChanged() {
    const onValuesChange = vi.fn();
    const view = renderWithForm(<Fields />, {
      formProps: { defaultValues: DEFAULTS, onValuesChange },
    });
    const { formInstance, getByRole, container } = view;
    const swatches = within(getByRole('radiogroup', { name: 'Swatch' }));

    await act(async () => {
      await userEvent.click(getByRole('checkbox', { name: 'Checkbox' }));
      await userEvent.click(swatches.getAllByRole('radio')[0]);
      formInstance.setFieldsValue(CHANGED, true);
    });

    expect(formInstance.getFieldsValue()).not.toEqual(DEFAULTS);

    // Every control belongs to the form, so the reset event reaches them all.
    const formElement = container.querySelector('form')!;
    const controls = container.querySelectorAll<HTMLInputElement>(
      'input, textarea, select',
    );

    expect(controls.length).toBeGreaterThan(10);
    expect(
      Array.from(controls, (control) => control.form === formElement),
    ).not.toContain(false);

    onValuesChange.mockClear();

    return { ...view, formElement, onValuesChange };
  }

  function expectDefaults({
    formInstance,
    getByRole,
    container,
    onValuesChange,
  }: Awaited<ReturnType<typeof renderChanged>>) {
    expect(errors).toEqual([]);
    expect(formInstance.getFieldsValue()).toEqual(DEFAULTS);
    // One report of the reset, and none of React Aria's per-input writes.
    expect(onValuesChange).toHaveBeenCalledTimes(1);
    expect(onValuesChange).toHaveBeenLastCalledWith(
      expect.objectContaining(DEFAULTS),
    );
    expect(getByRole('checkbox', { name: 'Checkbox' })).toBeChecked();
    expect(getByRole('switch', { name: 'Switch' })).toBeChecked();
    expect(getByRole('checkbox', { name: 'One' })).toBeChecked();
    expect(getByRole('checkbox', { name: 'Two' })).not.toBeChecked();
    expect(getByRole('radio', { name: 'One' })).toBeChecked();
    expect(container.querySelector('select')).toHaveValue('one');
  }

  // Drives eleven inputs through user-event, which can outrun the 5s default
  // on a busy runner.
  it('should reset every field to its form default through ResetButton', async () => {
    const view = await renderChanged();

    await act(async () => {
      await userEvent.click(view.getByRole('button', { name: 'Reset' }));
    });

    await waitFor(() => expect(view.formInstance.isTouched).toBe(false));
    expectDefaults(view);
  }, 10_000);

  it('should reset every field to its form default through form.reset()', async () => {
    const view = await renderChanged();

    await act(async () => {
      view.formElement.reset();
    });

    expect(view.formInstance.isTouched).toBe(false);
    expectDefaults(view);
  }, 10_000);
});

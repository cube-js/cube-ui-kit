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
  renderWithRoot,
  userEvent,
  within,
} from '../../../test/index';

import { createFormController } from './modern/controller';

import { Form, ResetButton } from './index';

import type { FormEvent } from 'react';

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

type NativeProps = { action?: string; method?: string };

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

function renderLegacy(nativeProps: NativeProps) {
  const onValuesChange = vi.fn();
  const view = renderWithForm(<Fields />, {
    formProps: { defaultValues: DEFAULTS, onValuesChange, ...nativeProps },
  });

  return {
    ...view,
    onValuesChange,
    getValues: () => view.formInstance.getFieldsValue(),
    setValues: (values: typeof CHANGED) =>
      view.formInstance.setFieldsValue(values, true),
  };
}

function renderModern(nativeProps: NativeProps) {
  const onValuesChange = vi.fn();
  const form = createFormController({
    defaultValues: DEFAULTS as Record<string, unknown>,
    onValuesChange,
  });
  const view = renderWithRoot(
    <Form form={form} {...nativeProps}>
      <Fields />
    </Form>,
  );

  return {
    ...view,
    onValuesChange,
    getValues: () => form.getValues(),
    setValues: (values: typeof CHANGED) => form.setValues(values),
  };
}

/**
 * Until CUB-5075 most of these inputs rendered `form="[object Object]"`, so
 * they had no form owner and a native reset never reached them. With a form
 * owner, React Aria's `useFormReset` listener on each input would write the
 * value it started with through `onChange` on every native reset, and ignore
 * `preventDefault`. A `CheckboxGroup` lands on `[]` that way, because React
 * Stately's `removeValue` filters the values from before the event. Both roots
 * reset the form once instead, in capture, before those listeners run, and
 * report the reset values to `onValuesChange` once. `action` changes nothing
 * here: it hands the browser the submit, not the form's values.
 */
describe.each([
  ['legacy', renderLegacy],
  ['modern', renderModern],
])('native reset of a %s form', (_, renderForm) => {
  const errors: unknown[] = [];
  const onError = (event: ErrorEvent) => errors.push(event.error);

  beforeEach(() => {
    errors.length = 0;
    window.addEventListener('error', onError);
  });

  afterEach(() => {
    window.removeEventListener('error', onError);
  });

  async function renderChanged(nativeProps: NativeProps) {
    const view = renderForm(nativeProps);
    const { getByRole, container } = view;
    const swatches = within(getByRole('radiogroup', { name: 'Swatch' }));

    await act(async () => {
      await userEvent.click(getByRole('checkbox', { name: 'Checkbox' }));
      await userEvent.click(swatches.getAllByRole('radio')[0]);
      view.setValues(CHANGED);
    });

    expect(view.getValues()).not.toEqual(DEFAULTS);

    // Every control belongs to the form, so the reset event reaches them all.
    const formElement = container.querySelector('form')!;
    const controls = container.querySelectorAll<HTMLInputElement>(
      'input, textarea, select',
    );

    expect(controls.length).toBeGreaterThan(10);
    expect(
      Array.from(controls, (control) => control.form === formElement),
    ).not.toContain(false);

    view.onValuesChange.mockClear();

    return { ...view, formElement };
  }

  function expectDefaults({
    getValues,
    getByRole,
    container,
    onValuesChange,
  }: Awaited<ReturnType<typeof renderChanged>>) {
    expect(errors).toEqual([]);
    expect(getValues()).toEqual(DEFAULTS);
    // One report of the reset, and none of React Aria's per-input writes.
    expect(onValuesChange).toHaveBeenCalledTimes(1);
    expect(onValuesChange.mock.lastCall?.[0]).toEqual(
      expect.objectContaining(DEFAULTS),
    );
    expect(getByRole('checkbox', { name: 'Checkbox' })).toBeChecked();
    expect(getByRole('switch', { name: 'Switch' })).toBeChecked();
    expect(getByRole('checkbox', { name: 'One' })).toBeChecked();
    expect(getByRole('checkbox', { name: 'Two' })).not.toBeChecked();
    expect(getByRole('radio', { name: 'One' })).toBeChecked();
    expect(container.querySelector('select')).toHaveValue('one');
  }

  describe.each<[string, NativeProps]>([
    ['without action', {}],
    ['with action', { action: '/save', method: 'post' }],
  ])('%s', (__, nativeProps) => {
    // Drives eleven inputs through user-event, which can outrun the 5s default
    // on a busy runner.
    it('should reset every field to its form default through ResetButton', async () => {
      const view = await renderChanged(nativeProps);

      await act(async () => {
        await userEvent.click(view.getByRole('button', { name: 'Reset' }));
        // The legacy `ResetButton` resets once more on the next tick.
        await new Promise((resolve) => setTimeout(resolve));
      });

      expectDefaults(view);
    }, 10_000);

    it('should reset every field to its form default through form.reset()', async () => {
      const view = await renderChanged(nativeProps);

      await act(async () => {
        view.formElement.reset();
      });

      expectDefaults(view);
    }, 10_000);
  });
});

describe('native reset of a modern action form', () => {
  it('should run onReset first and let it cancel the reset', async () => {
    const onReset = vi.fn((event: FormEvent) => event.preventDefault());
    const form = createFormController({ defaultValues: { text: 'text' } });
    const { container, getByRole } = renderWithRoot(
      <Form form={form} action="/save" method="post" onReset={onReset}>
        <TextInput name="text" label="Text" />
      </Form>,
    );

    await act(async () => {
      await userEvent.type(getByRole('textbox', { name: 'Text' }), '!');
    });

    await act(async () => {
      container.querySelector('form')!.reset();
    });

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(form.getValues()).toEqual({ text: 'text!' });
    expect(getByRole('textbox', { name: 'Text' })).toHaveValue('text!');
  });
});

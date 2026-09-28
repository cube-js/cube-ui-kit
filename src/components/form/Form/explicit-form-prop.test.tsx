import { cloneElement } from 'react';

import {
  Checkbox,
  CheckboxGroup,
  ColorInput,
  ComboBox,
  CommandTextArea,
  DateInput,
  DatePicker,
  DateRangePicker,
  DateRangeSeparatedPicker,
  FileInput,
  FilterListBox,
  FilterPicker,
  ListBox,
  NumberInput,
  PasswordInput,
  Picker,
  Radio,
  RadioGroup,
  RangeSlider,
  Select,
  Slider,
  Switch,
  TagInput,
  TextArea,
  TextInput,
  TextInputMapper,
  TimeInput,
} from '../../../index';
import { act, renderWithRoot, userEvent } from '../../../test/index';

import { Form, useForm } from './index';

import type { CubeFormInstance } from './use-form';

/**
 * Inputs can be linked to a form via the `form` prop instead of relying on the `<Form />` context. These
 * tests guard that path, since the form context is now injected inside `useFieldProps`.
 */
describe('explicit form prop', () => {
  function Standalone({ form }: { form: CubeFormInstance<any> }) {
    return (
      <>
        <TextInput form={form} name="text" label="Text" />
        <Checkbox form={form} name="checkbox" label="Checkbox" />
        <Select form={form} name="select" label="Select">
          <Select.Item key="one">One</Select.Item>
          <Select.Item key="two">Two</Select.Item>
        </Select>
      </>
    );
  }

  it('should link an input to a form outside of any <Form />', async () => {
    let formInstance!: CubeFormInstance<any>;

    function Wrapper() {
      [formInstance] = useForm();

      return <Standalone form={formInstance} />;
    }

    const { getByRole } = renderWithRoot(<Wrapper />);

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'Hello');
    });

    expect(formInstance.getFieldValue('text')).toBe('Hello');

    await act(async () => {
      await userEvent.click(getByRole('checkbox'));
    });

    expect(formInstance.getFieldValue('checkbox')).toBe(true);
  });

  it('should propagate the form value back into the input', async () => {
    let formInstance!: CubeFormInstance<any>;

    function Wrapper() {
      [formInstance] = useForm();

      return <Standalone form={formInstance} />;
    }

    const { getByRole } = renderWithRoot(<Wrapper />);

    await act(async () => {
      formInstance.setFieldValue('text', 'From the form');
    });

    expect(getByRole('textbox')).toHaveValue('From the form');
  });

  it('should validate rules of an explicitly linked field', async () => {
    let formInstance!: CubeFormInstance<any>;

    function Wrapper() {
      [formInstance] = useForm();

      return (
        <TextInput
          form={formInstance}
          name="text"
          label="Text"
          rules={[{ required: true, message: 'Required!' }]}
        />
      );
    }

    const { getByRole, getByText } = renderWithRoot(<Wrapper />);

    await act(async () => {
      await formInstance.validateField('text').catch(() => {});
    });

    expect(getByText('Required!')).toBeInTheDocument();
    expect(getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('should prefer the explicit form prop over the surrounding form context', async () => {
    let outerForm!: CubeFormInstance<any>;
    let explicitForm!: CubeFormInstance<any>;

    function Wrapper() {
      [outerForm] = useForm();
      [explicitForm] = useForm();

      return (
        <Form form={outerForm}>
          <TextInput form={explicitForm} name="text" label="Text" />
        </Form>
      );
    }

    const { getByRole } = renderWithRoot(<Wrapper />);

    await act(async () => {
      await userEvent.type(getByRole('textbox'), 'Hi');
    });

    expect(explicitForm.getFieldValue('text')).toBe('Hi');
    expect(outerForm.getFieldValue('text')).toBeUndefined();
  });

  describe.each([
    ['Checkbox', <Checkbox label="Checkbox" />],
    [
      'CheckboxGroup',
      <CheckboxGroup label="CheckboxGroup">
        <Checkbox value="one">One</Checkbox>
      </CheckboxGroup>,
    ],
    [
      'ComboBox',
      <ComboBox label="ComboBox">
        <ComboBox.Item key="one">One</ComboBox.Item>
      </ComboBox>,
    ],
    ['ColorInput', <ColorInput label="ColorInput" />],
    ['CommandTextArea', <CommandTextArea label="CommandTextArea" />],
    ['DateInput', <DateInput label="DateInput" />],
    ['DatePicker', <DatePicker label="DatePicker" />],
    ['DateRangePicker', <DateRangePicker label="DateRangePicker" />],
    [
      'DateRangeSeparatedPicker',
      <DateRangeSeparatedPicker label="DateRangeSeparatedPicker" />,
    ],
    ['FileInput', <FileInput label="FileInput" />],
    [
      'FilterListBox',
      <FilterListBox label="FilterListBox">
        <FilterListBox.Item key="one">One</FilterListBox.Item>
      </FilterListBox>,
    ],
    [
      'FilterPicker',
      <FilterPicker label="FilterPicker">
        <FilterPicker.Item key="one">One</FilterPicker.Item>
      </FilterPicker>,
    ],
    [
      'ListBox',
      <ListBox label="ListBox">
        <ListBox.Item key="one">One</ListBox.Item>
      </ListBox>,
    ],
    ['NumberInput', <NumberInput label="NumberInput" />],
    ['PasswordInput', <PasswordInput label="PasswordInput" />],
    [
      'Picker',
      <Picker label="Picker">
        <Picker.Item key="one">One</Picker.Item>
      </Picker>,
    ],
    ['RangeSlider', <RangeSlider label="RangeSlider" />],
    [
      'RadioGroup',
      <RadioGroup label="RadioGroup">
        <Radio value="one">One</Radio>
      </RadioGroup>,
    ],
    [
      'RadioGroup (buttons)',
      <RadioGroup label="RadioGroup" type="button">
        <Radio value="one">One</Radio>
      </RadioGroup>,
    ],
    [
      'Select',
      <Select label="Select">
        <Select.Item key="one">One</Select.Item>
      </Select>,
    ],
    ['Slider', <Slider label="Slider" />],
    ['Switch', <Switch label="Switch" />],
    ['TagInput', <TagInput label="TagInput" />],
    ['TextArea', <TextArea label="TextArea" />],
    ['TextInput', <TextInput label="TextInput" />],
    ['TextInputMapper', <TextInputMapper label="TextInputMapper" />],
    ['TimeInput', <TimeInput label="TimeInput" />],
  ])('%s', (name, element) => {
    it('should register in a form passed via the form prop', () => {
      let formInstance!: CubeFormInstance<any>;

      function Wrapper() {
        [formInstance] = useForm();

        return cloneElement(element, { form: formInstance, name: 'field' });
      }

      renderWithRoot(<Wrapper />);

      expect(formInstance.getFieldInstance('field')).toBeDefined();
    });

    // React Aria writes `form` onto native inputs as the id of their `<form>`,
    // so a form instance there rendered `form="[object Object]"` and detached
    // the input from its form: Enter in it submitted nothing (CUB-5075).
    it('should not leak the form instance into the DOM', () => {
      function Wrapper() {
        const [form] = useForm();

        return (
          <>
            {cloneElement(element, { form, name: 'explicit' })}
            <Form form={form}>{cloneElement(element, { name: 'nested' })}</Form>
            {cloneElement(element, { form })}
          </>
        );
      }

      const { container } = renderWithRoot(<Wrapper />);

      expect(
        [...container.querySelectorAll('[form]')].map((el) => el.outerHTML),
      ).toEqual([]);
    });
  });
});

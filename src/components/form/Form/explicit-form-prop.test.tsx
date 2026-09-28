import { cloneElement, ReactElement } from 'react';

import {
  Checkbox,
  CheckboxGroup,
  ColorInput,
  ColorPicker,
  ColorSwatchGroup,
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
  MonthPicker,
  NumberInput,
  PasswordInput,
  PeriodPicker,
  Picker,
  QuarterPicker,
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
  WeekPicker,
  YearPicker,
} from '../../../index';
import { act, renderWithRoot, userEvent, waitFor } from '../../../test/index';

import { Form, useForm } from './index';

import type { CubeFormInstance } from './use-form';

/** Every form-attachable input, mounted bare; each test adds the form wiring it needs. */
const FORM_ATTACHABLE_INPUTS: [string, ReactElement<any>][] = [
  ['Checkbox', <Checkbox label="Checkbox" />],
  [
    'CheckboxGroup',
    <CheckboxGroup label="CheckboxGroup">
      <Checkbox value="one">One</Checkbox>
    </CheckboxGroup>,
  ],
  ['ColorInput', <ColorInput label="ColorInput" />],
  ['ColorPicker', <ColorPicker label="ColorPicker" swatches={['#ff0000']} />],
  [
    'ColorSwatchGroup',
    <ColorSwatchGroup label="ColorSwatchGroup" colors={['#ff0000']} />,
  ],
  [
    'ComboBox',
    <ComboBox label="ComboBox">
      <ComboBox.Item key="one">One</ComboBox.Item>
    </ComboBox>,
  ],
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
  ['MonthPicker', <MonthPicker label="MonthPicker" />],
  ['NumberInput', <NumberInput label="NumberInput" />],
  ['PasswordInput', <PasswordInput label="PasswordInput" />],
  ['PeriodPicker', <PeriodPicker label="PeriodPicker" />],
  [
    'Picker',
    <Picker label="Picker">
      <Picker.Item key="one">One</Picker.Item>
    </Picker>,
  ],
  ['QuarterPicker', <QuarterPicker label="QuarterPicker" />],
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
  ['WeekPicker', <WeekPicker label="WeekPicker" />],
  ['YearPicker', <YearPicker label="YearPicker" />],
];

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

  describe.each(FORM_ATTACHABLE_INPUTS)('%s', (name, element) => {
    it('should register in a form passed via the form prop', () => {
      let formInstance!: CubeFormInstance<any>;

      function Wrapper() {
        [formInstance] = useForm();

        return cloneElement(element, { form: formInstance, name: 'field' });
      }

      renderWithRoot(<Wrapper />);

      expect(formInstance.getFieldInstance('field')).toBeDefined();
    });
  });
});

// React Aria writes `form` onto native inputs as the id of their `<form>`, so a
// form instance there rendered `form="[object Object]"` and detached the input
// from its form: Enter in it submitted nothing (CUB-5075).
describe('form instance in the DOM', () => {
  function formAttributes(root: ParentNode) {
    return Array.from(root.querySelectorAll('[form]'), (el) => el.outerHTML);
  }

  describe.each(FORM_ATTACHABLE_INPUTS)('%s', (name, element) => {
    it('should not leak a legacy instance', () => {
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

      expect(formAttributes(container)).toEqual([]);
    });

    it('should not leak a modern controller', () => {
      function Wrapper() {
        const form = Form.useController();

        return (
          <>
            {cloneElement(element, { form, name: 'explicit' })}
            <Form form={form}>{cloneElement(element, { name: 'nested' })}</Form>
            {cloneElement(element, { form })}
          </>
        );
      }

      const { container } = renderWithRoot(<Wrapper />);

      expect(formAttributes(container)).toEqual([]);
    });
  });

  // The swatches only mount with the popover, under the picker's form context.
  it('should not leak a legacy instance from an open ColorPicker', async () => {
    function Wrapper() {
      const [form] = useForm();

      return (
        <Form form={form}>
          <ColorPicker name="color" label="Color" swatches={['#ff0000']} />
        </Form>
      );
    }

    const { getByRole } = renderWithRoot(<Wrapper />);

    await act(async () => {
      await userEvent.click(getByRole('button', { name: /color/i }));
    });
    await waitFor(() => expect(getByRole('dialog')).toBeInTheDocument());

    expect(
      getByRole('dialog').querySelectorAll('input').length,
    ).toBeGreaterThan(0);
    expect(formAttributes(document.body)).toEqual([]);
  });
});

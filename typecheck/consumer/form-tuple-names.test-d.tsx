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
  Form,
  ListBox,
  NumberInput,
  PasswordInput,
  PeriodPicker,
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
  useFieldProps,
} from '@cube-dev/ui-kit';

import type { FormPath } from '@cube-dev/ui-kit';

// Every built-in input must accept tuple names in the published declarations.
export function TupleNamesOnEveryInput() {
  const form = Form.useController();
  return (
    <>
      <TextInput name={['fields', 'text']} label="Text" form={form} />
      <TextArea name={['fields', 'textarea']} label="Text area" form={form} />
      <PasswordInput
        name={['fields', 'password']}
        label="Password"
        form={form}
      />
      <NumberInput name={['fields', 'number']} label="Number" form={form} />
      <CommandTextArea
        name={['fields', 'command']}
        label="Command"
        form={form}
      />
      <TextInputMapper name={['fields', 'mapper']} label="Mapper" form={form} />
      <Checkbox name={['fields', 'checkbox']} form={form}>
        Checkbox
      </Checkbox>
      <CheckboxGroup
        name={['fields', 'checkboxes']}
        label="Checkboxes"
        form={form}
      >
        <Checkbox value="one">One</Checkbox>
      </CheckboxGroup>
      <TagInput name={['fields', 'tags']} label="Tags" form={form} />
      <Switch name={['fields', 'switch']} form={form}>
        Switch
      </Switch>
      <RadioGroup name={['fields', 'radios']} label="Radios" form={form}>
        <Radio value="one">One</Radio>
      </RadioGroup>
      <Select name={['fields', 'select']} label="Select" form={form}>
        <Select.Item key="one">One</Select.Item>
      </Select>
      <ComboBox name={['fields', 'combobox']} label="Combo box" form={form}>
        <ComboBox.Item key="one">One</ComboBox.Item>
      </ComboBox>
      <ListBox name={['fields', 'listbox']} label="List box" form={form}>
        <ListBox.Item key="one">One</ListBox.Item>
      </ListBox>
      <Picker name={['fields', 'picker']} label="Picker" form={form}>
        <Picker.Item key="one">One</Picker.Item>
      </Picker>
      <FilterListBox
        name={['fields', 'filterlistbox']}
        label="Filter list box"
        form={form}
      >
        <FilterListBox.Item key="one">One</FilterListBox.Item>
      </FilterListBox>
      <FilterPicker
        name={['fields', 'filterpicker']}
        label="Filter picker"
        form={form}
      >
        <FilterPicker.Item key="one">One</FilterPicker.Item>
      </FilterPicker>
      <Slider
        name={['fields', 'slider']}
        label="Slider"
        maxValue={10}
        form={form}
      />
      <RangeSlider name={['fields', 'range']} label="Range" form={form} />
      <DateInput name={['fields', 'date']} label="Date" form={form} />
      <DatePicker
        name={['fields', 'datepicker']}
        label="Date picker"
        form={form}
      />
      <DateRangePicker
        name={['fields', 'daterange']}
        label="Date range"
        form={form}
      />
      <DateRangeSeparatedPicker
        name={['fields', 'daterange2']}
        label="Date range"
        form={form}
      />
      <TimeInput name={['fields', 'time']} label="Time" form={form} />
      <PeriodPicker name={['fields', 'period']} label="Period" form={form} />
      <FileInput name={['fields', 'file']} label="File" form={form} />
      <ColorInput name={['fields', 'color']} label="Color" form={form} />
      <ColorPicker
        name={['fields', 'colorpicker']}
        label="Color picker"
        form={form}
      />
      <ColorSwatchGroup
        name={['fields', 'swatches']}
        label="Swatches"
        form={form}
      />
    </>
  );
}

export function TupleNameTypes() {
  const form = Form.useController();
  const readonlyPath = ['rows', 0, 'email'] as const;
  const dynamicPath: FormPath = ['rows', 1, 'email'];
  const valid = <TextInput form={form} name={readonlyPath} />;
  const dynamic = <TextInput form={form} name={dynamicPath} />;
  // The shared hook resolves even a readonly tuple to a string for native inputs.
  const resolved = useFieldProps({ form, name: readonlyPath });
  const native = <input name={resolved.name} />;
  // @ts-expect-error a name is a string or tuple, not a scalar number
  const number = <TextInput name={42} />;
  // @ts-expect-error tuple path segments are strings or numbers
  const segment = <TextInput name={['rows', false]} />;
  const legacy = (
    // @ts-expect-error Form.Item is a legacy-only wrapper with string names
    <Form.Item name={readonlyPath}>
      <TextInput />
    </Form.Item>
  );
  return (
    <>
      {valid}
      {dynamic}
      {native}
      {number}
      {segment}
      {legacy}
    </>
  );
}

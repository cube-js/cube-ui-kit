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
  Select,
  Slider,
  Switch,
  TextArea,
  TextInput,
  TextInputMapper,
  TimeInput,
} from '@cube-dev/ui-kit';

/**
 * Consumer-facing type fixture, compiled against `dist/` by
 * `pnpm test:types:consumer` (see `tsconfig.consumer.json`). Every
 * form-attachable input must accept a form instance in `form`: react-aria's
 * DOM `form?: string` attribute must not win over the kit's prop when a
 * consumer resolves react-aria's types for real.
 */
export function ExplicitInstanceOnEveryInput({ modern = false }) {
  const [legacy] = Form.useForm();
  const controller = Form.useController();
  const form = modern ? controller : legacy;

  return (
    <>
      <TextInput name="text" label="Text" form={form} />
      <TextArea name="textarea" label="Text area" form={form} />
      <PasswordInput name="password" label="Password" form={form} />
      <NumberInput name="number" label="Number" form={form} />
      <CommandTextArea name="command" label="Command" form={form} />
      <TextInputMapper name="mapper" label="Mapper" form={form} />
      <Checkbox name="checkbox" form={form}>
        Checkbox
      </Checkbox>
      <CheckboxGroup name="checkboxes" label="Checkboxes" form={form}>
        <Checkbox value="one">One</Checkbox>
      </CheckboxGroup>
      <Switch name="switch" form={form}>
        Switch
      </Switch>
      <RadioGroup name="radios" label="Radios" form={form}>
        <Radio value="one">One</Radio>
      </RadioGroup>
      <Select name="select" label="Select" form={form}>
        <Select.Item key="one">One</Select.Item>
      </Select>
      <ComboBox name="combobox" label="Combo box" form={form}>
        <ComboBox.Item key="one">One</ComboBox.Item>
      </ComboBox>
      <ListBox name="listbox" label="List box" form={form}>
        <ListBox.Item key="one">One</ListBox.Item>
      </ListBox>
      <Picker name="picker" label="Picker" form={form}>
        <Picker.Item key="one">One</Picker.Item>
      </Picker>
      <FilterListBox name="filterlistbox" label="Filter list box" form={form}>
        <FilterListBox.Item key="one">One</FilterListBox.Item>
      </FilterListBox>
      <FilterPicker name="filterpicker" label="Filter picker" form={form}>
        <FilterPicker.Item key="one">One</FilterPicker.Item>
      </FilterPicker>
      <Slider name="slider" label="Slider" maxValue={10} form={form} />
      <DateInput name="date" label="Date" form={form} />
      <DatePicker name="datepicker" label="Date picker" form={form} />
      <DateRangePicker name="daterange" label="Date range" form={form} />
      <DateRangeSeparatedPicker
        name="daterange2"
        label="Date range"
        form={form}
      />
      <TimeInput name="time" label="Time" form={form} />
      <PeriodPicker name="period" label="Period" form={form} />
      <FileInput name="file" label="File" form={form} />
      <ColorInput name="color" label="Color" form={form} />
      <ColorPicker name="colorpicker" label="Color picker" form={form} />
      <ColorSwatchGroup name="swatches" label="Swatches" form={form} />
    </>
  );
}

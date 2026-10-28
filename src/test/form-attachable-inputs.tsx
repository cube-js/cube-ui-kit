/**
 * Every form-attachable input, mounted bare with a `label`; each spec adds the
 * wiring it needs. Specs that must hold for every input run over this list, so
 * a new form-attachable input belongs here.
 */
import { ReactElement } from 'react';

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
  SearchComboBox,
  SearchInput,
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
} from '../index';

export const FORM_ATTACHABLE_INPUTS: [string, ReactElement<any>][] = [
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
 * Every field-level input: the form-attachable ones, plus `SearchInput` and
 * `SearchComboBox`, which render the field chrome but never bind to a form.
 */
export const FIELD_INPUTS: [string, ReactElement<any>][] = [
  ...FORM_ATTACHABLE_INPUTS,
  ['SearchInput', <SearchInput label="SearchInput" />],
  [
    'SearchComboBox',
    <SearchComboBox label="SearchComboBox">
      <SearchComboBox.Item key="one">One</SearchComboBox.Item>
    </SearchComboBox>,
  ],
];

import {
  Checkbox,
  ColorPicker,
  DatePicker,
  FileInput,
  FilterPicker,
  ListBox,
  Picker,
  Radio,
  RadioGroup,
  Select,
  Slider,
  TextInput,
} from '@cube-dev/ui-kit';

import type { FieldLayoutStyleProps } from '@cube-dev/ui-kit';

/**
 * An input's style props are exactly its field layout props, which place and
 * size its outer element. Appearance goes through `styles`.
 */
export function FieldLayoutStyleExamples() {
  const layout: FieldLayoutStyleProps = { width: '40x', flexGrow: 1 };

  return (
    <>
      <TextInput label="Name" {...layout} />
      <TextInput label="Name" width="40x" styles={{ width: '20x' }} />
      <ListBox label="Options" height="30x" gridArea="list">
        <ListBox.Item key="a">Alpha</ListBox.Item>
      </ListBox>

      {/* @ts-expect-error appearance is not a field style prop */}
      <TextInput label="Name" fill="#white" />
      {/* @ts-expect-error appearance is not a field style prop */}
      <Select label="Letter" padding="1x">
        <Select.Item key="a">Alpha</Select.Item>
      </Select>
      <TextInput label="Name" styles={{ fill: '#white', padding: '1x' }} />

      {/* One member of each family takes the layout props and no others. */}
      <Picker label="Letter" width="40x">
        <Picker.Item key="a">Alpha</Picker.Item>
      </Picker>
      {/* @ts-expect-error appearance is not a field style prop */}
      <Picker label="Letter" padding="1x">
        <Picker.Item key="a">Alpha</Picker.Item>
      </Picker>
      <FilterPicker label="Letter" width="40x">
        <FilterPicker.Item key="a">Alpha</FilterPicker.Item>
      </FilterPicker>
      {/* @ts-expect-error appearance is not a field style prop */}
      <FilterPicker label="Letter" border="left">
        <FilterPicker.Item key="a">Alpha</FilterPicker.Item>
      </FilterPicker>
      <Checkbox label="Terms" margin="1x top" />
      {/* @ts-expect-error appearance is not a field style prop */}
      <Checkbox label="Terms" border />
      <RadioGroup label="Plan" width="40x">
        <Radio value="free">Free</Radio>
      </RadioGroup>
      {/* @ts-expect-error appearance is not a field style prop */}
      <RadioGroup label="Plan" gap="2x" />
      <Slider label="Volume" width="40x" />
      {/* @ts-expect-error appearance is not a field style prop */}
      <Slider label="Volume" fill="#white" />
      <DatePicker label="Day" width="40x" />
      {/* @ts-expect-error appearance is not a field style prop */}
      <DatePicker label="Day" border />
      <FileInput label="File" width="40x" />
      {/* @ts-expect-error appearance is not a field style prop */}
      <FileInput label="File" radius="1r" />
      <ColorPicker label="Color" width="40x" />
      {/* @ts-expect-error appearance is not a field style prop */}
      <ColorPicker label="Color" shadow="0 0 1x #dark" />
    </>
  );
}

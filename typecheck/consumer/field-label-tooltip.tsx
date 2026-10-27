import {
  Checkbox,
  ColorPicker,
  FilterPicker,
  Form,
  Picker,
  Radio,
  Select,
  Slider,
  TextInput,
} from '@cube-dev/ui-kit';

/**
 * The info badge next to a field's label is `labelTooltip`; `tooltip` is the
 * control's own. A consumer must see the old spelling as an error on every
 * field, including React Aria-derived props, except `Select`, `Picker`,
 * `FilterPicker` and `ColorPicker`, where `tooltip` is the trigger's tooltip,
 * and `Checkbox` and the text inputs, where it is the control's own.
 */
export function FieldLabelTooltips() {
  return (
    <>
      <TextInput
        label="Email"
        labelTooltip="Where we write"
        tooltip={{ title: 'Over the field box', placement: 'right' }}
      />

      <Picker label="Letter" labelTooltip="Why it matters">
        <Picker.Item key="a">Alpha</Picker.Item>
      </Picker>
      <Picker label="Letter" tooltip="On the trigger">
        <Picker.Item key="a">Alpha</Picker.Item>
      </Picker>
      {/* The deprecated spelling still type-checks. */}
      <Picker label="Letter" triggerTooltip="On the trigger">
        <Picker.Item key="a">Alpha</Picker.Item>
      </Picker>

      <FilterPicker label="Letter" tooltip="On the trigger">
        <FilterPicker.Item key="a">Alpha</FilterPicker.Item>
      </FilterPicker>
      <FilterPicker label="Letter" triggerTooltip="On the trigger">
        <FilterPicker.Item key="a">Alpha</FilterPicker.Item>
      </FilterPicker>

      <ColorPicker label="Color" tooltip="On the trigger" />
      <ColorPicker label="Color" triggerTooltip="On the trigger" />

      <Slider label="Volume" labelTooltip="How loud" />
      {/* @ts-expect-error the label badge is `labelTooltip` */}
      <Slider label="Volume" tooltip="How loud" />

      <Radio.Group label="Plan" labelTooltip="Billed monthly">
        <Radio value="free">Free</Radio>
      </Radio.Group>
      {/* @ts-expect-error the group's label badge is `labelTooltip` */}
      <Radio.Group label="Plan" tooltip="Billed monthly">
        <Radio value="free" tooltip="The option's own tooltip">
          Free
        </Radio>
      </Radio.Group>

      <Form.Item name="email" label="Email" labelTooltip="Where we write">
        <TextInput />
      </Form.Item>

      <Checkbox
        label="Terms"
        labelTooltip="Why we ask"
        tooltip={{ title: 'Over the box and its label', placement: 'right' }}
      >
        I agree
      </Checkbox>

      <Select
        label="Letter"
        tooltip="On the trigger"
        labelTooltip="On the label"
      >
        <Select.Item key="a">Alpha</Select.Item>
      </Select>
    </>
  );
}

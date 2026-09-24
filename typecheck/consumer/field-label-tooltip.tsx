import {
  Checkbox,
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
 * field — including the ones whose React Aria-derived props this repo's own
 * `preserveSymlinks` setup cannot check — except `Select`, where `tooltip`
 * remains the trigger's tooltip, and `Checkbox`, where it is the checkbox's.
 */
export function FieldLabelTooltips() {
  return (
    <>
      <TextInput label="Email" labelTooltip="Where we write" />
      {/* @ts-expect-error the label badge is `labelTooltip` */}
      <TextInput label="Email" tooltip="Where we write" />

      <Picker label="Letter" labelTooltip="Why it matters">
        <Picker.Item key="a">Alpha</Picker.Item>
      </Picker>
      {/* @ts-expect-error a picker's trigger tooltip is `triggerTooltip` */}
      <Picker label="Letter" tooltip="Why it matters">
        <Picker.Item key="a">Alpha</Picker.Item>
      </Picker>

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

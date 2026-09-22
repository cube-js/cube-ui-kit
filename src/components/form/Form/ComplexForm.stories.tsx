import { StoryFn } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { baseProps } from '../../../stories/lists/baseProps';
import { timeout } from '../../../utils/promise';
import { Block } from '../../Block';
import { Text } from '../../content/Text';
import { Checkbox } from '../../fields/Checkbox/Checkbox';
import { CheckboxGroup } from '../../fields/Checkbox/CheckboxGroup';
import { ComboBox } from '../../fields/ComboBox/ComboBox';
import { DateInput } from '../../fields/DatePicker/DateInput';
import { parseAbsoluteDate } from '../../fields/DatePicker/parseDate';
import { FileInput } from '../../fields/FileInput/FileInput';
import { NumberInput } from '../../fields/NumberInput/NumberInput';
import { PasswordInput } from '../../fields/PasswordInput/PasswordInput';
import { Radio } from '../../fields/RadioGroup/Radio';
import { RadioGroup } from '../../fields/RadioGroup/RadioGroup';
import { Select } from '../../fields/Select/Select';
import { RangeSlider } from '../../fields/Slider/RangeSlider';
import { Slider } from '../../fields/Slider/Slider';
import { Switch } from '../../fields/Switch/Switch';
import { TextInput } from '../../fields/TextInput/TextInput';
import { Space } from '../../layout/Space';
import { FieldWrapper } from '../FieldWrapper/FieldWrapper';

import { Form } from './index';

import type { ModernFormProps } from './ModernFormRoot';

type StoryProps = Omit<ModernFormProps, 'form'>;

export default {
  title: 'Forms/ComplexForm',
  component: Form,
  parameters: { controls: { exclude: baseProps } },
};

const CustomSubmitErrorTemplate: StoryFn<StoryProps> = (args) => {
  const form = Form.useController({ defaultValues: { text: '' } });
  return (
    <Form
      {...args}
      form={form}
      onSubmit={() => Promise.reject(<>Submission failed. Sorry for that :/</>)}
    >
      <TextInput name="text" label="Text input" />
      <Form.Submit>Submit</Form.Submit>
      <Form.SubmitError shape="sharp" theme="warning" />
    </Form>
  );
};

const SubmitErrorTemplate: StoryFn<StoryProps> = (args) => {
  const form = Form.useController({ defaultValues: { text: '' } });
  return (
    <Form
      {...args}
      form={form}
      onSubmit={() => Promise.reject(<>Submission failed. Sorry for that :/</>)}
    >
      <TextInput name="text" label="Text input" />
      <Form.Submit>Submit</Form.Submit>
      <Form.SubmitError />
    </Form>
  );
};

const AsyncValidationTemplate: StoryFn<StoryProps> = (args) => {
  const form = Form.useController({ defaultValues: { text: '' } });
  return (
    <Form
      {...args}
      form={form}
      onSubmit={(values) => console.log('onSubmit:', values)}
    >
      <TextInput
        label="Text input"
        validateTrigger="onSubmit"
        field={form.field('text', {
          async validate(value, { signal }) {
            await timeout(1000);
            if (signal.aborted) return;
            if ((value?.length ?? 0) < 8) {
              return (
                <>
                  This field should be{' '}
                  <Text.Strong>at least 8 symbols</Text.Strong> long
                </>
              );
            }
          },
        })}
      />
      <Space>
        <Form.Submit>Submit</Form.Submit>
        <Form.Reset>Reset</Form.Reset>
      </Space>
    </Form>
  );
};

const ComplexErrorTemplate: StoryFn<StoryProps> = (args) => {
  const form = Form.useController({ defaultValues: { text: '' } });
  return (
    <Form {...args} form={form}>
      <TextInput
        label="Text input"
        field={form.field('text', {
          rules: [{ required: true, message: 'This field is required' }],
          validate(value) {
            if ((value?.length ?? 0) < 8) {
              return (
                <>
                  This field should be{' '}
                  <Text.Strong>at least 8 symbols</Text.Strong> long
                </>
              );
            }
          },
        })}
      />
    </Form>
  );
};

const Template: StoryFn<StoryProps> = (args) => {
  const form = Form.useController({
    defaultValues: {
      text: 'some',
      checkbox: true,
      select: { one: 'three' },
      combobox: 'two',
      checkboxGroup: ['one', 'three'],
      radioGroup: 'three',
      switch: false,
      slider: 60,
      rangeSlider: [20, 40],
      date: parseAbsoluteDate('2023-10-04'),
    },
  });
  return (
    <Form
      {...args}
      form={form}
      onSubmit={(values) => console.log('onSubmit:', values)}
      onValuesChange={(values) => console.log('onChange', values)}
    >
      <TextInput
        showValid
        label="Text field"
        validateTrigger="onChange"
        validationDelay={1000}
        field={form.field('text', {
          rules: [{ required: true, message: 'This field is required' }],
          validate: (value) =>
            (value?.length ?? 0) < 8
              ? 'This field should be at least 8 symbols long'
              : undefined,
        })}
      />
      <TextInput isDisabled name="text2" label="Text disabled" />
      <FieldWrapper label="Custom field" tooltip="What?">
        <Block>Test</Block>
      </FieldWrapper>
      <TextInput
        name="email"
        type="email"
        size="small"
        label="Email field"
        necessityIndicator="label"
        rules={[
          { required: true, message: 'This field is required' },
          {
            type: 'email',
            message: 'This field should be a valid email address',
          },
        ]}
      />
      <PasswordInput name="password" label="Password field" />
      <DateInput name="date" label="Date field" />
      <FileInput name="fileContent" label="File field" />
      <Select
        name={['select', 'one']}
        label="Select field"
        tooltip="Additional field description"
      >
        <Select.Item key="one">One</Select.Item>
        <Select.Item key="two">Two</Select.Item>
        <Select.Item key="three">Three</Select.Item>
      </Select>
      <ComboBox name="combobox" label="ComboBox field">
        <ComboBox.Item key="one">One</ComboBox.Item>
        <ComboBox.Item key="two">Two</ComboBox.Item>
        <ComboBox.Item key="three">Three</ComboBox.Item>
      </ComboBox>
      <CheckboxGroup
        name="checkboxGroup"
        label="Checkbox group"
        orientation="vertical"
        rules={[
          { required: true, message: 'Specify at least a single option' },
        ]}
      >
        <Checkbox value="one">One</Checkbox>
        <Checkbox value="two">Two</Checkbox>
        <Checkbox value="three">Three</Checkbox>
      </CheckboxGroup>
      <RadioGroup name="radioGroup" label="Radio group" orientation="vertical">
        <Radio value="one">One</Radio>
        <Radio value="two">Two</Radio>
        <Radio value="three">Three</Radio>
      </RadioGroup>
      <Checkbox
        name="checkbox"
        label="Checkbox field"
        rules={[{ required: true, message: 'This field is required' }]}
      >
        Checkbox value
      </Checkbox>
      <Switch
        name="switch"
        label="Switch field"
        rules={[{ required: true, message: 'This field is required' }]}
      >
        Switch value
      </Switch>
      <NumberInput
        name="number"
        label="Number field"
        minValue={-1}
        rules={[{ required: true, message: 'This field is required' }]}
      />
      <Slider
        name="slider"
        label="Slider"
        rules={[{ required: true, message: 'This field is required' }]}
      />
      <RangeSlider
        name="rangeSlider"
        label="Range slider"
        minValue={0}
        maxValue={100}
        rules={[{ required: true, message: 'This field is required' }]}
      />
      <Space>
        <Form.Submit>Submit</Form.Submit>
        <Form.Reset>Reset</Form.Reset>
      </Space>
    </Form>
  );
};

export const Default = Template.bind({});
export const ComplexFormSideLabel = Template.bind({});
ComplexFormSideLabel.args = { labelPosition: 'side' };
export const ComplexFormSplitLabel = Template.bind({});
ComplexFormSplitLabel.args = { labelPosition: 'split' };
export const ComplexErrorMessage = ComplexErrorTemplate.bind({});
export const AsyncValidation = AsyncValidationTemplate.bind({});
export const CustomErrorMessage = CustomSubmitErrorTemplate.bind({});
export const ErrorMessage = SubmitErrorTemplate.bind({});

ErrorMessage.play = CustomErrorMessage.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button'));
  await waitFor(() => expect(canvas.getByRole('alert')).toBeInTheDocument());
};

ComplexErrorMessage.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.type(canvas.getByRole('textbox'), 'short');
  await userEvent.tab();
  await waitFor(() =>
    expect(canvas.getByText('at least 8 symbols')).toBeVisible(),
  );
};

AsyncValidation.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
  await waitFor(
    () => expect(canvas.getByText('at least 8 symbols')).toBeVisible(),
    { timeout: 3000 },
  );
};

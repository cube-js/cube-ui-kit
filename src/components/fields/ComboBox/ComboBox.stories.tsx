import { DollarCircleOutlined } from '@ant-design/icons';
import { Meta, StoryFn } from '@storybook/react';
import { expect, jest } from '@storybook/jest';
import { userEvent, within } from '@storybook/test';

import { SELECTED_KEY_ARG } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';
import { wait } from '../../../test/utils/wait';
import { Button } from '../../actions/index';
import { Field, Form } from '../../form/index';
import { Flow } from '../../layout/Flow';

import { ComboBox, CubeComboBoxProps } from './ComboBox';

export default {
  title: 'Pickers/ComboBox',
  component: ComboBox,
  subcomponents: { Item: ComboBox.Item },
  args: { id: 'name', width: '200px', label: 'Choose your favourite color' },
  parameters: { controls: { exclude: baseProps } },
  argTypes: { ...SELECTED_KEY_ARG },
} as Meta<CubeComboBoxProps<any>>;

const Template: StoryFn<CubeComboBoxProps<any>> = (
  args: CubeComboBoxProps<any>,
) => (
  <>
    <ComboBox {...args}>
      <ComboBox.Item key="red">Red</ComboBox.Item>
      <ComboBox.Item key="orange">Orange</ComboBox.Item>
      <ComboBox.Item key="yellow">Yellow</ComboBox.Item>
      <ComboBox.Item key="green">Green</ComboBox.Item>
      <ComboBox.Item key="blue">Blue</ComboBox.Item>
      <ComboBox.Item key="purple">Purple</ComboBox.Item>
      <ComboBox.Item key="violet">Violet</ComboBox.Item>
    </ComboBox>
  </>
);

const TemplateForm: StoryFn<CubeComboBoxProps<any>> = (
  args: CubeComboBoxProps<any>,
) => {
  const [form] = Form.useForm();
  const onSubmit = (data: any) => {
    console.log('! submit', data);
    if (args.onSubmitSpy) {
      args.onSubmitSpy(data);
    }
    return data;
  };

  return (
    <Flow gap="2x">
      <Form
        form={form}
        defaultValues={{ combobox: args.allowsCustomValue ? 'unknown' : 'red' }}
        onSubmit={onSubmit}
      >
        <ComboBox
          name="combobox"
          {...args}
          rules={[
            {
              required: true,
            },
            {
              pattern: /^[A-Za-z_][A-Za-z0-9_]*$/,
              message: 'Please enter valid variable name',
            },
          ]}
        >
          <ComboBox.Item key="red">
            {args.allowsCustomValue ? 'red' : 'Red'}
          </ComboBox.Item>
          <ComboBox.Item key="orange">
            {args.allowsCustomValue ? 'orange' : 'Orange'}
          </ComboBox.Item>
          <ComboBox.Item key="yellow">
            {args.allowsCustomValue ? 'yellow' : 'Yellow'}
          </ComboBox.Item>
          <ComboBox.Item key="green">
            {args.allowsCustomValue ? 'green' : 'Green'}
          </ComboBox.Item>
          <ComboBox.Item key="blue">
            {args.allowsCustomValue ? 'blue' : 'Blue'}
          </ComboBox.Item>
          <ComboBox.Item key="purple">
            {args.allowsCustomValue ? 'purple' : 'Purple'}
          </ComboBox.Item>
          <ComboBox.Item key="violet">
            {args.allowsCustomValue ? 'violet' : 'Violet'}
          </ComboBox.Item>
        </ComboBox>
        <Button type="submit" data-testid="SubmitButton">
          Submit
        </Button>
      </Form>
      <Button>Focus</Button>
    </Flow>
  );
};

const TemplateFormPropagation: StoryFn<CubeComboBoxProps<any>> = (
  args: CubeComboBoxProps<any>,
) => {
  const [form] = Form.useForm();
  const onSubmit = (data: any) => {
    console.log('! submit', data);
    if (args.onSubmitSpy) {
      args.onSubmitSpy(data);
    }
    return data;
  };

  return (
    <Flow gap="2x">
      <Form
        form={form}
        defaultValues={{ combobox: args.allowsCustomValue ? 'unknown' : 'red' }}
        onSubmit={onSubmit}
      >
        <ComboBox
          name="combobox"
          {...args}
          rules={[
            {
              required: true,
            },
            {
              pattern: /^[A-Za-z_][A-Za-z0-9_]*$/,
              message: 'Please enter valid variable name',
            },
          ]}
        >
          <ComboBox.Item key="red">
            {args.allowsCustomValue ? 'red' : 'Red'}
          </ComboBox.Item>
          <ComboBox.Item key="orange">
            {args.allowsCustomValue ? 'orange' : 'Orange'}
          </ComboBox.Item>
          <ComboBox.Item key="yellow">
            {args.allowsCustomValue ? 'yellow' : 'Yellow'}
          </ComboBox.Item>
          <ComboBox.Item key="green">
            {args.allowsCustomValue ? 'green' : 'Green'}
          </ComboBox.Item>
          <ComboBox.Item key="blue">
            {args.allowsCustomValue ? 'blue' : 'Blue'}
          </ComboBox.Item>
          <ComboBox.Item key="purple">
            {args.allowsCustomValue ? 'purple' : 'Purple'}
          </ComboBox.Item>
          <ComboBox.Item key="violet">
            {args.allowsCustomValue ? 'violet' : 'Violet'}
          </ComboBox.Item>
        </ComboBox>
        <Form.Submit data-testid="FormSubmit">Submit</Form.Submit>
      </Form>
    </Flow>
  );
};

const TemplateLegacyForm: StoryFn<CubeComboBoxProps<any>> = (
  args: CubeComboBoxProps<any>,
) => {
  const [form] = Form.useForm();
  const onSubmit = (data: any) => {
    console.log('! Submit', data);
    if (args.onSubmitSpy) {
      args.onSubmitSpy(data);
    }
    return data;
  };

  return (
    <Flow gap="2x">
      <Form
        form={form}
        defaultValues={{ combobox: args.allowsCustomValue ? 'unknown' : 'red' }}
        onSubmit={onSubmit}
      >
        <Field
          name="combobox"
          rules={[
            {
              required: true,
              pattern: /^[A-Za-z_][A-Za-z0-9_]*$/,
              message: 'Please enter valid variable name',
            },
          ]}
        >
          <ComboBox {...args}>
            <ComboBox.Item key="red">
              {args.allowsCustomValue ? 'red' : 'Red'}
            </ComboBox.Item>
            <ComboBox.Item key="orange">
              {args.allowsCustomValue ? 'orange' : 'Orange'}
            </ComboBox.Item>
            <ComboBox.Item key="yellow">
              {args.allowsCustomValue ? 'yellow' : 'Yellow'}
            </ComboBox.Item>
            <ComboBox.Item key="green">
              {args.allowsCustomValue ? 'green' : 'Green'}
            </ComboBox.Item>
            <ComboBox.Item key="blue">
              {args.allowsCustomValue ? 'blue' : 'Blue'}
            </ComboBox.Item>
            <ComboBox.Item key="purple">
              {args.allowsCustomValue ? 'purple' : 'Purple'}
            </ComboBox.Item>
            <ComboBox.Item key="violet">
              {args.allowsCustomValue ? 'violet' : 'Violet'}
            </ComboBox.Item>
          </ComboBox>
        </Field>
        <Button type="submit" data-testid="SubmitButton">
          Submit
        </Button>
      </Form>
      <Button>Focus</Button>
    </Flow>
  );
};

export const Default = Template.bind({});
Default.args = {};

export const WithPlaceholder = Template.bind({});
WithPlaceholder.args = { placeholder: 'Enter a value' };

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultSelectedKey: 'purple' };

export const WithIcon = Template.bind({});
WithIcon.args = { icon: <DollarCircleOutlined /> };

export const Invalid = Template.bind({});
Invalid.args = { selectedKey: 'yellow', validationState: 'invalid' };

export const Valid = Template.bind({});
Valid.args = { selectedKey: 'yellow', validationState: 'valid' };

export const Disabled = Template.bind({});
Disabled.args = { selectedKey: 'yellow', isDisabled: true };

export const Wide: StoryFn<CubeComboBoxProps<any>> = (
  args: CubeComboBoxProps<any>,
) => (
  <ComboBox {...args}>
    <ComboBox.Item key="red">
      Red lorem ipsum dolor sit amet, consectetur adipiscing elit.
    </ComboBox.Item>
    <ComboBox.Item key="blue">
      Blue lorem ipsum dolor sit amet, consectetur adipiscing elit.
    </ComboBox.Item>
  </ComboBox>
);

Wide.args = { width: '600px', defaultSelectedKey: 'red' };

export const With1LongOption: StoryFn<CubeComboBoxProps<any>> = (
  args: CubeComboBoxProps<any>,
) => (
  <ComboBox {...args}>
    <ComboBox.Item key="red">Red</ComboBox.Item>
    <ComboBox.Item key="orange">Orange</ComboBox.Item>
    <ComboBox.Item key="yellow">Yellow</ComboBox.Item>
    <ComboBox.Item key="green">
      green lorem ipsum dolor sit amet, consectetur adipiscing elit
    </ComboBox.Item>
    <ComboBox.Item key="blue">Blue</ComboBox.Item>
    <ComboBox.Item key="purple">Purple</ComboBox.Item>
    <ComboBox.Item key="violet">Violet</ComboBox.Item>
  </ComboBox>
);
With1LongOption.parameters = { layout: 'centered' };
With1LongOption.play = async ({ canvasElement }) => {
  const { getByRole } = within(canvasElement);

  const openButton = getByRole('button');

  await userEvent.click(openButton);
};

export const With1LongOptionFiltered = With1LongOption.bind({});
With1LongOptionFiltered.parameters = { layout: 'centered' };
With1LongOptionFiltered.play = async ({ canvasElement }) => {
  const { getByRole } = within(canvasElement);

  const combobox = getByRole('combobox');

  await userEvent.type(combobox, 'Red');
};

export const WithinForm = TemplateForm.bind({});
WithinForm.args = {
  onSubmitSpy: jest.fn(),
};
WithinForm.play = async ({ canvasElement, args }) => {
  const { getByRole, getByTestId } = within(canvasElement);

  const combobox = getByRole('combobox');
  const trigger = getByTestId('ComboBoxTrigger');
  const button = getByTestId('Button');
  const input = getByTestId('Input');
  const submitButton = getByTestId('SubmitButton');

  await userEvent.click(combobox);
  await userEvent.click(trigger);
  await wait(250);
  await userEvent.click(button);
  await userEvent.type(
    input,
    '{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}blue',
  );

  // Submit the form
  await userEvent.click(submitButton);

  // Check that the onSubmit callback was called with the expected data
  await wait(100);
  expect(args.onSubmitSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      combobox: 'blue',
    }),
  );
};

export const WithinFormSelected = TemplateForm.bind({});
WithinFormSelected.args = {
  onSubmitSpy: jest.fn(),
};
WithinFormSelected.play = async ({ canvasElement, args }) => {
  const { getByRole, getByTestId } = within(canvasElement);

  const combobox = getByRole('combobox');
  const trigger = getByTestId('ComboBoxTrigger');
  const button = getByTestId('Button');
  const input = getByTestId('Input');
  const submitButton = getByTestId('SubmitButton');

  await userEvent.click(combobox);
  await userEvent.click(trigger);
  await wait(250);
  await userEvent.click(button);
  await userEvent.type(
    input,
    '{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}blue{enter}',
  );

  // Submit the form
  await userEvent.click(submitButton);

  // Check that the onSubmit callback was called with the expected data
  await wait(100);
  expect(args.onSubmitSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      combobox: 'blue',
    }),
  );
};

export const WithinFormWithCustomValue = TemplateForm.bind({});
WithinFormWithCustomValue.play = WithinForm.play;
WithinFormWithCustomValue.args = {
  ...TemplateForm.args,
  allowsCustomValue: true,
  onSubmitSpy: jest.fn(),
};

export const WithinFormWithLegacyFieldAndCustomValue = TemplateLegacyForm.bind(
  {},
);
WithinFormWithLegacyFieldAndCustomValue.play = WithinForm.play;
WithinFormWithLegacyFieldAndCustomValue.args = {
  ...TemplateForm.args,
  allowsCustomValue: true,
  onSubmitSpy: jest.fn(),
};

export const WithinFormStopEnterPropagation = TemplateFormPropagation.bind({});
WithinFormStopEnterPropagation.args = {
  onSubmitSpy: jest.fn(),
};
WithinFormStopEnterPropagation.play = async ({ canvasElement, args }) => {
  const { getByTestId } = within(canvasElement);

  const input = getByTestId('Input');

  await userEvent.type(
    input,
    '{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}{backspace}blurring{enter}',
  );

  // The enter key should submit the form
  await wait(100);

  // Check that the onSubmit callback was called with the expected data
  expect(args.onSubmitSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      combobox: 'blurring',
    }),
  );
};

export const WithinFormStopBlurPropagation = TemplateFormPropagation.bind({});
WithinFormStopBlurPropagation.args = {
  onSubmitSpy: jest.fn(),
};
WithinFormStopBlurPropagation.play = async ({ canvasElement, args }) => {
  const { getByTestId } = within(canvasElement);

  const input = getByTestId('Input');
  const submitButton = getByTestId('Button');

  await userEvent.type(input, '!');
  await userEvent.click(submitButton);

  // Now submit the form
  const formSubmit = getByTestId('FormSubmit');
  await userEvent.click(formSubmit);

  // Check that the onSubmit callback was called with the expected data
  await wait(100);
  expect(args.onSubmitSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      combobox: 'red!',
    }),
  );
};

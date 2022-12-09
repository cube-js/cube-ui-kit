import { Meta, StoryFn } from '@storybook/react';
import { linkTo } from '@storybook/addon-links';
import { userEvent, waitFor, within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { ReactNode } from 'react';

import {
  Alert,
  Block,
  Checkbox,
  CheckboxGroup,
  ComboBox,
  Form,
  Item,
  PasswordInput,
  Radio,
  RangeSlider,
  Select,
  Submit,
  SubmitError,
  Switch,
  TextInput,
  CubeFormProps,
} from '../../../index';
import { NumberInput } from '../NumberInput/NumberInput';
import { baseProps } from '../../../stories/lists/baseProps';
import { Button } from '../../actions';
import { timeout } from '../../../utils/promise';
import { FieldWrapper } from '../FieldWrapper';

export default {
  title: 'Forms/ComplexForm',
  component: Form,
  parameters: { controls: { exclude: baseProps } },
} as Meta<CubeFormProps>;

const UnknownSubmitErrorTemplate: StoryFn<CubeFormProps> = (args) => {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      {...args}
      onSubmit={(v) => {
        args.onSubmit?.(v);
        throw new Error('Unknown error');
      }}
    >
      <TextInput
        label="Text input"
        name="text"
        rules={[
          () => ({
            async validator() {
              await timeout(1000);
            },
          }),
        ]}
      />
      <Submit>Submit</Submit>
      <SubmitError />
    </Form>
  );
};

const CustomSubmitErrorTemplate: StoryFn<CubeFormProps> = (args) => {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      {...args}
      onSubmit={(v) => {
        args.onSubmit?.(v);

        throw <>Submission failed. Sorry for that :/</>;
      }}
    >
      <TextInput label="Text input" name="text" />
      <Form.Submit>Submit</Form.Submit>
      {form.submitError ? <Alert>{form.submitError as ReactNode}</Alert> : null}
    </Form>
  );
};

const SubmitErrorTemplate: StoryFn<CubeFormProps> = (args) => {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      {...args}
      onSubmit={(v) => {
        console.log('onSubmit:', v);

        throw <>Submission failed. Sorry for that :/</>;
      }}
      onValuesChange={(v) => {
        console.log('onChange', v);
      }}
    >
      <TextInput label="Text input" name="text" />
      <Form.Submit>Submit</Form.Submit>
      <SubmitError />
    </Form>
  );
};

const AsyncValidationTemplate: StoryFn<typeof Form> = (args) => {
  const [form] = Form.useForm();

  return (
    <Form form={form} {...args}>
      <TextInput
        label="Text input"
        name="text"
        validateTrigger="onSubmit"
        rules={[
          () => ({
            async validator(rule, value) {
              await timeout(1000);

              return value?.length >= 8
                ? Promise.resolve()
                : Promise.reject(
                    <>
                      This field should be <b>at least 8 symbols</b> long
                    </>,
                  );
            },
          }),
        ]}
      />
      <Form.Submit>Submit</Form.Submit>
    </Form>
  );
};

const ComplexErrorTemplate: StoryFn<typeof Form> = (args) => {
  const [form] = Form.useForm();

  return (
    <Form form={form} {...args}>
      <TextInput
        label="Text input"
        name="text"
        rules={[
          { required: true, message: 'This field is required' },
          () => ({
            validator(rule, value) {
              return value.length >= 8
                ? Promise.resolve()
                : Promise.reject(
                    <>
                      This field should be <b>at least 8 symbols</b> long
                    </>,
                  );
            },
          }),
        ]}
      />
    </Form>
  );
};

const Template: StoryFn<typeof Form> = (args) => {
  const [form] = Form.useForm();

  return (
    <>
      <FieldWrapper
        label="Custom field outside the any form"
        tooltip="What?"
        Component={<Block>Some non-editable content</Block>}
      />
      <Form
        {...args}
        form={form}
        defaultValues={{
          text: 'some',
          text2: 'some',
          checkbox: true,
          select: {
            one: 'three',
          },
          combobox: 'two',
          combobox2: 'two',
          checkboxGroup: ['one', 'three'],
          radioGroup: 'three',
          switch: false,
          slider: [20, 40],
        }}
      >
        <TextInput
          label="Text field"
          name="text"
          validateTrigger="onChange"
          rules={[
            { required: true, message: 'This field is required' },
            () => ({
              validator(rule, value) {
                return value.length >= 8
                  ? Promise.resolve()
                  : Promise.reject(
                      'This field should be at least 8 symbols long',
                    );
              },
            }),
          ]}
        />
        <TextInput isDisabled name="text2" label="Text disabled" />
        <TextInput isLoading name="text2" label="Text loading" />
        <FieldWrapper
          label="Custom field"
          tooltip="What?"
          Component={<Block>Test</Block>}
        />
        <TextInput
          type="email"
          label="Email field"
          necessityIndicator="label"
          name="email"
          rules={[
            { required: true, message: 'This field is required' },
            {
              type: 'email',
              message: 'This field should be a valid email address',
            },
          ]}
          defaultValue="tenphi@gmail.com"
          shouldUpdate={({ email }) => !!email}
        />
        <PasswordInput label="Password field" name="password" />
        <Select
          label="Select field"
          tooltip="Additional field description"
          name="select.one"
        >
          <Item key="one">One</Item>
          <Item key="two">Two</Item>
          <Item key="three">Three</Item>
        </Select>
        <ComboBox label="ComboBox field" name="combobox">
          <Item key="one">One</Item>
          <Item key="two">Two</Item>
          <Item key="three">Three</Item>
        </ComboBox>
        <ComboBox isLoading label="ComboBox Loading field" name="combobox2">
          <Item key="one">One</Item>
          <Item key="two">Two</Item>
          <Item key="three">Three</Item>
        </ComboBox>
        <CheckboxGroup
          label="Checkbox group"
          orientation="horizontal"
          name="checkboxGroup"
          rules={[
            { required: true, message: 'Specify at least a single option' },
          ]}
        >
          <Checkbox value="one">One</Checkbox>
          <Checkbox value="two">Two</Checkbox>
          <Checkbox value="three">Three</Checkbox>
        </CheckboxGroup>
        <Radio.Group label="Radio group" name="radioGroup">
          <Radio value="one">One</Radio>
          <Radio value="two">Two</Radio>
          <Radio value="three">Three</Radio>
        </Radio.Group>
        <Checkbox
          label="Checkbox field"
          name="checkbox"
          rules={[{ required: true, message: 'This field is required' }]}
        />
        <Switch
          label="Switch field"
          name="switch"
          rules={[{ required: true, message: 'This field is required' }]}
        />
        <NumberInput
          label="Number field"
          minValue={-1}
          name="number"
          rules={[{ required: true, message: 'This field is required' }]}
        />
        <RangeSlider
          showInput
          minValue={0}
          maxValue={100}
          rules={[{ required: true, message: 'This field is required' }]}
          name="slider"
        />
        <Form.Submit>Submit</Form.Submit>
      </Form>
    </>
  );
};

export const FormInsideDialog: StoryFn = () => {
  return (
    <Button onPress={linkTo('Overlays/DialogForm')}>
      Moved to a Dialog Form Page
    </Button>
  );
};

export const Default = Template.bind({});

export const ComplexErrorMessage = ComplexErrorTemplate.bind({});

export const AsyncValidation = AsyncValidationTemplate.bind({});

export const CustomErrorMessage = CustomSubmitErrorTemplate.bind({});

export const ErrorMessage = SubmitErrorTemplate.bind({});

ErrorMessage.play = CustomErrorMessage.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = canvas.getByRole('button');

  await userEvent.click(button);

  await canvas.findByRole('alert');
};

export const UnknownErrorMessage = UnknownSubmitErrorTemplate.bind({});

UnknownErrorMessage.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = canvas.getByRole('button');

  await userEvent.click(button);

  await waitFor(async () => {
    const alertElement = canvas.getByText('Internal error');

    await expect(alertElement).toBeInTheDocument();

    await userEvent.click(button);

    expect(alertElement).not.toBeInTheDocument();
  });
};

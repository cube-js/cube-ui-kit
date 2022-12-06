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
  Field,
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
      <Field
        name="text"
        rules={[
          () => ({
            async validator() {
              await timeout(1000);
            },
          }),
        ]}
      >
        <TextInput label="Text input" />
      </Field>
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
      <Field name="text">
        <TextInput label="Text input" />
      </Field>
      <Submit>Submit</Submit>
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
      <Field name="text">
        <TextInput label="Text input" />
      </Field>
      <Submit>Submit</Submit>
      <SubmitError />
    </Form>
  );
};

const AsyncValidationTemplate: StoryFn<typeof Form> = (args) => {
  const [form] = Form.useForm();

  return (
    <Form form={form} {...args}>
      <Field
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
      >
        <TextInput label="Text input" />
      </Field>
      <Form.Submit>Submit</Form.Submit>
    </Form>
  );
};

const ComplexErrorTemplate: StoryFn<typeof Form> = (args) => {
  const [form] = Form.useForm();

  return (
    <Form form={form} {...args}>
      <Field
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
      >
        <TextInput label="Text input" />
      </Field>
    </Form>
  );
};

const Template: StoryFn<typeof Form> = (args) => {
  const [form] = Form.useForm();

  return (
    <>
      <Field>
        <Block label="Custom field outside the any form">
          Some non-editable content
        </Block>
      </Field>
      <Form
        form={form}
        {...args}
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
        <Field
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
        >
          <TextInput label="Text field" />
        </Field>
        <Field name="text2">
          <TextInput isDisabled label="Text disabled" />
        </Field>
        <Field name="text2">
          <TextInput isLoading label="Text loading" />
        </Field>
        <Field>
          <Block label="Custom field">Test</Block>
        </Field>
        <Field
          name="email"
          rules={[
            { required: true, message: 'This field is required' },
            {
              type: 'email',
              message: 'This field should be a valid email address',
            },
          ]}
          defaultValue="tenphi@gmail.com"
          shouldUpdate={({ email }) => {
            return !!email;
          }}
        >
          <TextInput
            type="email"
            label="Email field"
            necessityIndicator="label"
          />
        </Field>
        <Field name="password">
          <PasswordInput label="Password field" />
        </Field>
        <Field name={['select', 'one']}>
          <Select label="Select field" tooltip="Additional field description">
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
          </Select>
        </Field>
        <Field name="combobox">
          <ComboBox label="ComboBox field">
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
          </ComboBox>
        </Field>
        <Field name="combobox2">
          <ComboBox isLoading label="ComboBox Loading field">
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
          </ComboBox>
        </Field>
        <Field
          name="checkboxGroup"
          rules={[
            { required: true, message: 'Specify at least a single option' },
          ]}
        >
          <CheckboxGroup label="Checkbox group" orientation="horizontal">
            <Checkbox value="one">One</Checkbox>
            <Checkbox value="two">Two</Checkbox>
            <Checkbox value="three">Three</Checkbox>
          </CheckboxGroup>
        </Field>
        <Field name="radioGroup">
          <Radio.Group label="Radio group">
            <Radio value="one">One</Radio>
            <Radio value="two">Two</Radio>
            <Radio value="three">Three</Radio>
          </Radio.Group>
        </Field>
        <Field
          name="checkbox"
          rules={[{ required: true, message: 'This field is required' }]}
        >
          <Checkbox label="Checkbox field" />
        </Field>
        <Field
          name="switch"
          rules={[{ required: true, message: 'This field is required' }]}
        >
          <Switch label="Switch field" />
        </Field>
        <Field
          name="number"
          rules={[{ required: true, message: 'This field is required' }]}
        >
          <NumberInput label="Number field" minValue={-1} />
        </Field>
        <Field
          name="slider"
          rules={[{ required: true, message: 'This field is required' }]}
        >
          <RangeSlider showInput minValue={0} maxValue={100} />
        </Field>
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

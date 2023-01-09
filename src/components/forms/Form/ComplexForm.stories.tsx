import { StoryFn } from '@storybook/react';
import { linkTo } from '@storybook/addon-links';
import { userEvent, waitFor, within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

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
  NumberInput,
} from '../../../index';
// import { NumberInput } from '../NumberInput/NumberInput';
import { baseProps } from '../../../stories/lists/baseProps';
import { Button } from '../../actions';
import { timeout } from '../../../utils/promise';

export default {
  title: 'Forms/ComplexForm',
  component: Form,
  parameters: { controls: { exclude: baseProps } },
};

const UnknownSubmitErrorTemplate: StoryFn<typeof Form> = (args) => {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      {...args}
      onSubmit={(v) => {
        console.log('onSubmit:', v);

        throw new Error('Unknown error');
      }}
      onSubmitFailed={(e) => {
        console.log('onSubmitFailed', e);
      }}
      onValuesChange={(v) => {
        console.log('onChange', v);
      }}
    >
      <Field
        name="text"
        label="Text input"
        rules={[
          () => ({
            async validator() {
              await timeout(1000);
            },
          }),
        ]}
      >
        <TextInput />
      </Field>
      <Submit>Submit</Submit>
      <SubmitError />
    </Form>
  );
};

const CustomSubmitErrorTemplate: StoryFn<typeof Form> = (args) => {
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
      <Field name="text" label="Text input">
        <TextInput />
      </Field>
      <Submit>Submit</Submit>
      {form.submitError ? <Alert>{form.submitError}</Alert> : null}
    </Form>
  );
};

const SubmitErrorTemplate: StoryFn<typeof Form> = (args) => {
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
      <Field name="text" label="Text input">
        <TextInput />
      </Field>
      <Submit>Submit</Submit>
      <SubmitError />
    </Form>
  );
};

const AsyncValidationTemplate: StoryFn<typeof Form> = (args) => {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      {...args}
      onSubmit={(v) => {
        console.log('onSubmit:', v);
      }}
      onValuesChange={(v) => {
        console.log('onChange', v);
      }}
    >
      <Field
        name="text"
        label="Text input"
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
        <TextInput />
      </Field>
      <Submit>Submit</Submit>
    </Form>
  );
};

const ComplexErrorTemplate: StoryFn<typeof Form> = (args) => {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      {...args}
      onSubmit={(v) => {
        console.log('onSubmit:', v);
      }}
      onValuesChange={(v) => {
        console.log('onChange', v);
      }}
    >
      <Field
        name="text"
        label="Text input"
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
        <TextInput />
      </Field>
    </Form>
  );
};

const Template: StoryFn<typeof Form> = (args) => {
  const [form] = Form.useForm();

  return (
    <>
      <Form
        form={form}
        {...args}
        defaultValues={{
          text: 'some',
          checkbox: true,
          select: {
            one: 'three', // select.one
          },
          combobox: 'two',
          checkboxGroup: ['one', 'three'],
          radioGroup: 'three',
          switch: false,
          slider: [20, 40],
        }}
        onSubmit={(v) => {
          console.log('onSubmit:', v);
        }}
        onValuesChange={(v) => {
          console.log('onChange', v);
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
        <Field isDisabled name="text2" label="Text disabled">
          <TextInput />
        </Field>
        <Field label="Custom field" tooltip="What?">
          <Block>Test</Block>
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
          necessityIndicator={'label'}
          defaultValue="tenphi@gmail.com"
          shouldUpdate={({ email }) => {
            return !!email;
          }}
        >
          <TextInput type="email" label="Email field" />
        </Field>
        <Field name="password">
          <PasswordInput label="Password field" />
        </Field>
        <Field
          name={['select', 'one']}
          label="Select field"
          tooltip="Additional field description"
        >
          <Select>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
          </Select>
        </Field>
        <Field name="combobox" label="ComboBox field">
          <ComboBox>
            <Item key="one">One</Item>
            <Item key="two">Two</Item>
            <Item key="three">Three</Item>
          </ComboBox>
        </Field>
        <Field
          name="checkboxGroup"
          label="Checkbox group"
          rules={[
            {
              required: true,
              message: 'Specify at least a single option',
            },
          ]}
        >
          <CheckboxGroup orientation="horizontal">
            <Checkbox value="one">One</Checkbox>
            <Checkbox value="two">Two</Checkbox>
            <Checkbox value="three">Three</Checkbox>
          </CheckboxGroup>
        </Field>
        <Field name="radioGroup" label="Radio group">
          <Radio.Group>
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
        <Submit>Submit</Submit>
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
Default.parameters = { chromatic: { disableSnapshot: true } };

export const ComplexErrorMessage = ComplexErrorTemplate.bind({});
ComplexErrorTemplate.parameters = { chromatic: { disableSnapshot: true } };

export const AsyncValidation = AsyncValidationTemplate.bind({});

export const CustomErrorMessage = CustomSubmitErrorTemplate.bind({});

export const ErrorMessage = SubmitErrorTemplate.bind({});

ErrorMessage.play = CustomErrorMessage.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = await canvas.getByRole('button');

  await userEvent.click(button);

  await waitFor(() => expect(canvas.getByRole('alert')).toBeInTheDocument());
};

export const UnknownErrorMessage = UnknownSubmitErrorTemplate.bind({});

UnknownErrorMessage.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = await canvas.getByRole('button');

  await userEvent.click(button);

  await waitFor(async () => {
    const alertElement = await canvas.getByText('Internal error');

    await expect(alertElement).toBeInTheDocument();

    await userEvent.click(button);

    expect(alertElement).not.toBeInTheDocument();
  });
};

import { linkTo } from '@storybook/addon-links';
import { StoryFn } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';

import {
  Block,
  Button,
  Checkbox,
  CheckboxGroup,
  ComboBox,
  DateInput,
  Field,
  FileInput,
  Form,
  Item,
  NumberInput,
  parseAbsoluteDate,
  PasswordInput,
  Radio,
  RangeSlider,
  Select,
  Slider,
  Space,
  Switch,
  TextInput,
} from '../../../index';
// import { NumberInput } from '../NumberInput/NumberInput';
import { baseProps } from '../../../stories/lists/baseProps';
import { timeout } from '../../../utils/promise';

export default {
  title: 'Forms/ComplexForm',
  component: Form,
  parameters: { controls: { exclude: baseProps } },
};

// const UnknownSubmitErrorTemplate: StoryFn<typeof Form> = (args) => {
//   const [form] = Form.useForm();
//
//   return (
//     <Form
//       form={form}
//       {...args}
//       onSubmit={(v) => {
//         console.log('onSubmit:', v);
//
//         throw new Error('Unknown error');
//       }}
//       onSubmitFailed={(e) => {
//         console.log('onSubmitFailed', e);
//       }}
//       onValuesChange={(v) => {
//         console.log('onChange', v);
//       }}
//     >
//       <Field
//         name="text"
//         label="Text input"
//         rules={[
//           () => ({
//             async validator() {
//               await timeout(1000);
//             },
//           }),
//         ]}
//       >
//         <TextInput />
//       </Field>
//       <Form.Submit>Submit</Form.Submit>
//       <Form.SubmitError />
//     </Form>
//   );
// };

const CustomSubmitErrorTemplate: StoryFn<typeof Form> = (args) => {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      {...args}
      onSubmit={(v) => {
        console.log('onSubmit:', v);

        return Promise.reject(<>Submission failed. Sorry for that :/</>);
      }}
      onValuesChange={(v) => {
        console.log('onChange', v);
      }}
    >
      <Field name="text" label="Text input">
        <TextInput />
      </Field>
      <Form.Submit>Submit</Form.Submit>
      <Form.SubmitError />
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

        return Promise.reject(<>Submission failed. Sorry for that :/</>);
      }}
      onValuesChange={(v) => {
        console.log('onChange', v);
      }}
    >
      <Field name="text" label="Text input">
        <TextInput />
      </Field>
      <Form.Submit>Submit</Form.Submit>
      <Form.SubmitError />
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
      <Space>
        <Form.Submit>Submit</Form.Submit>
        <Form.Reset>Reset</Form.Reset>
      </Space>
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
          slider: 60,
          rangeSlider: [20, 40],
          date: parseAbsoluteDate('2023-10-04'),
        }}
        onSubmit={(v) => {
          console.log('onSubmit:', v);
        }}
        onValuesChange={(v) => {
          console.log('onChange', v);
        }}
      >
        <Field
          showValid
          name="text"
          validateTrigger="onChange"
          validationDelay={1000}
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
          shouldUpdate={({ email }) => {
            return !!email;
          }}
        >
          <TextInput type="email" size="small" label="Email field" />
        </Field>
        <Field name="password">
          <PasswordInput label="Password field" />
        </Field>
        <DateInput name="date" label="Date field" />
        <FileInput name="fileContent" label="File field" />
        <Field
          name="select.one"
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
            { required: true, message: 'Specify at least a single option' },
          ]}
        >
          <CheckboxGroup orientation="vertical">
            <Checkbox value="one">One</Checkbox>
            <Checkbox value="two">Two</Checkbox>
            <Checkbox value="three">Three</Checkbox>
          </CheckboxGroup>
        </Field>
        <Field name="radioGroup" label="Radio group">
          <Radio.Group orientation="vertical">
            <Radio value="one">One</Radio>
            <Radio value="two">Two</Radio>
            <Radio value="three">Three</Radio>
          </Radio.Group>
        </Field>
        <Checkbox
          name="checkbox"
          rules={[{ required: true, message: 'This field is required' }]}
          label="Checkbox field"
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
        <Field
          name="number"
          rules={[{ required: true, message: 'This field is required' }]}
        >
          <NumberInput label="Number field" minValue={-1} />
        </Field>
        <Field
          label="Slider"
          name="slider"
          rules={[{ required: true, message: 'This field is required' }]}
        >
          <Slider minValue={0} maxValue={100} />
        </Field>
        <Field
          label="Slider"
          name="rangeSlider"
          rules={[{ required: true, message: 'This field is required' }]}
        >
          <RangeSlider minValue={0} maxValue={100} />
        </Field>
        <Space>
          <Form.Submit>Submit</Form.Submit>
          <Form.Reset>Reset</Form.Reset>
        </Space>
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

export const ComplexFormSideLabel = Template.bind({});
ComplexFormSideLabel.args = { labelPosition: 'side' };

export const ComplexErrorMessage = ComplexErrorTemplate.bind({});

export const AsyncValidation = AsyncValidationTemplate.bind({});

export const CustomErrorMessage = CustomSubmitErrorTemplate.bind({});

export const ErrorMessage = SubmitErrorTemplate.bind({});

ErrorMessage.play = CustomErrorMessage.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = await canvas.getByRole('button');

  await userEvent.click(button);

  await waitFor(() => expect(canvas.getByRole('alert')).toBeInTheDocument());
};

// export const UnknownErrorMessage = UnknownSubmitErrorTemplate.bind({});
//
// UnknownErrorMessage.play = async ({ canvasElement }) => {
//   const canvas = within(canvasElement);
//   const button = await canvas.getByRole('button');
//
//   await userEvent.click(button);
//
//   await waitFor(async () => {
//     const alertElement = await canvas.getByText('Internal error');
//
//     await timeout(2000);
//
//     await expect(alertElement).toBeInTheDocument();
//
//     await userEvent.click(button);
//
//     expect(alertElement).not.toBeInTheDocument();
//   });
// };

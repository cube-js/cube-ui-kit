import { useRef } from 'react';
import { Story } from '@storybook/react';
import { expect } from '@storybook/jest';
import { within, userEvent, waitFor } from '@storybook/testing-library';
import {
  Paragraph,
  Text,
  Submit,
  Button,
  TextInput,
  Select,
  ComboBox,
  Input,
  Form,
  Radio,
  Item,
  Field,
  Checkbox,
  CheckboxGroup,
  PasswordInput,
  Switch,
  Block,
  CubeFormProps,
} from '../../../index';
import { NumberInput } from '../NumberInput/NumberInput';
import { DialogForm } from '../../overlays/Dialog/DialogForm';
import { baseProps } from '../../../stories/lists/baseProps';

export default {
  title: 'Forms/ComplexForm',
  component: Form,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
};

const Template: Story<CubeFormProps> = (args) => {
  const [form] = Form.useForm();

  return (
    <>
      <Field label="Custom field outside the any form" tooltip="What?">
        <Block>Some non-editable content</Block>
      </Field>
      <Form
        form={form}
        {...args}
        onSubmit={(v) => {
          console.log('onSubmit:', v);
        }}
        onValuesChange={(v) => {
          console.log('onChange', v);
        }}
        defaultValues={{
          text: 'some',
          checkbox: true,
          select: {
            one: 'three',
          },
          combobox: 'two',
          checkboxGroup: ['one', 'three'],
          radioGroup: 'two',
          switch: false,
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
        <Submit>Submit</Submit>
      </Form>
    </>
  );
};

const TemplateDialog: Story = (args) => {
  const deleteDeploymentFormRef = useRef(null);

  function onPress() {
    deleteDeploymentFormRef?.current?.open();
  }

  return (
    <>
      <Button onPress={onPress}>Open Modal</Button>
      <DialogForm
        title="Confirm delete"
        ref={deleteDeploymentFormRef}
        submitProps={{ theme: 'danger', label: 'Delete' }}
      >
        <Paragraph>
          Are you sure you want to permanently delete&nbsp;
          <Text.Strong style={{ whiteSpace: 'pre' }}>deployment</Text.Strong>?
        </Paragraph>
        <Form.Item
          name="name"
          rules={[
            {
              validator(rule, value) {
                return value === 'deployment'
                  ? Promise.resolve()
                  : Promise.reject('Please enter your deployment name!');
              },
            },
          ]}
        >
          <Input
            placeholder="ENTER DEPLOYMENT NAME"
            data-qa="DeleteDeploymentName"
          />
        </Form.Item>
      </DialogForm>
    </>
  );
};

export const Default: typeof Template = Template.bind({});

export const FormInsideDialog: typeof TemplateDialog = TemplateDialog.bind({});
FormInsideDialog.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  const button = await canvas.findByRole('button');
  await userEvent.click(button);

  await waitFor(() => expect(canvas.getByRole('dialog')).toBeInTheDocument());
};

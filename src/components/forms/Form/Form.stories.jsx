import {
  TextInput,
  Select,
  ComboBox,
  Form,
  Radio,
  Item,
  Submit,
  Field,
  Checkbox,
  CheckboxGroup,
  PasswordInput,
  Switch, FieldWrapper, Block,
} from '../../../index';
import {
  IS_DISABLED_ARG,
  LABEL_POSITION_ARG,
  REQUIRED_MARK_ARG,
} from '../../../stories/FormFieldArgs';
import { NumberInput } from '../NumberInput/NumberInput';

export default {
  title: 'UIKit/Forms/Form',
  component: Form,
  argTypes: {
    ...IS_DISABLED_ARG,
    ...LABEL_POSITION_ARG,
    ...REQUIRED_MARK_ARG,
  },
};

const Template = ({ isDisabled, labelPosition, requiredMark }) => {
  const [form] = Form.useForm();
  // const [form2] = Form.useForm();

  return (
    <>
      <Field label="Custom field outside the any form" tooltip="What?">
        <Block>Test</Block>
      </Field>
      <Form
        form={form}
        isDisabled={isDisabled}
        labelPosition={labelPosition}
        requiredMark={requiredMark}
        labelStyles={{
          width: '200px',
          // textAlign: 'right',
        }}
        onSubmit={(v) => {
          console.log('onSubmit:', v);
        }}
        onValuesChange={(v) => {
          console.log('onChange', v);
        }}
        defaultValues={{
          text: 'some',
          // email: '',
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
        <Field name={['select', 'one']} label="Select field" tooltip="Additional field description">
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
      {/* testing for unique ids */}
      {/*  <Form*/}
      {/*  form={form2}*/}
      {/*  isDisabled={isDisabled}*/}
      {/*  labelPosition={labelPosition}*/}
      {/*  requiredMark={requiredMark}*/}
      {/*  labelStyles={{*/}
      {/*    width: '200px',*/}
      {/*    // textAlign: 'right',*/}
      {/*  }}*/}
      {/*  onSubmit={(v) => {*/}
      {/*    console.log('onSubmit:', v);*/}
      {/*  }}*/}
      {/*  onValuesChange={(v) => {*/}
      {/*    console.log('onChange', v);*/}
      {/*  }}*/}
      {/*  defaultValues={{*/}
      {/*    text: 'some',*/}
      {/*    email: '',*/}
      {/*    checkbox: true,*/}
      {/*    select: 'three',*/}
      {/*    combobox: 'two',*/}
      {/*    checkboxGroup: ['one', 'three'],*/}
      {/*    radioGroup: 'two',*/}
      {/*    switch: false,*/}
      {/*  }}*/}
      {/*>*/}
      {/*  <Field*/}
      {/*    name="text"*/}
      {/*    validateTrigger="onChange"*/}
      {/*    rules={[*/}
      {/*      { required: true, message: 'This field is required' },*/}
      {/*      () => ({*/}
      {/*        validator(rule, value) {*/}
      {/*          return value.length >= 8*/}
      {/*            ? Promise.resolve()*/}
      {/*            : Promise.reject(*/}
      {/*                'This field should be at least 8 symbols long',*/}
      {/*              );*/}
      {/*        },*/}
      {/*      }),*/}
      {/*    ]}*/}
      {/*  >*/}
      {/*    <TextInput label="Text field" />*/}
      {/*  </Field>*/}
      {/*  <Field*/}
      {/*    name="email"*/}
      {/*    rules={[*/}
      {/*      { required: true, message: 'This field is required' },*/}
      {/*      {*/}
      {/*        type: 'email',*/}
      {/*        message: 'This field should be a valid email address',*/}
      {/*      },*/}
      {/*    ]}*/}
      {/*  >*/}
      {/*    <TextInput type="email" label="Email field" />*/}
      {/*  </Field>*/}
      {/*  <Field name="password">*/}
      {/*    <PasswordInput label="Password field" />*/}
      {/*  </Field>*/}
      {/*  <Field name="select" label="Select field">*/}
      {/*    <Select>*/}
      {/*      <Item key="one">One</Item>*/}
      {/*      <Item key="two">Two</Item>*/}
      {/*      <Item key="three">Three</Item>*/}
      {/*    </Select>*/}
      {/*  </Field>*/}
      {/*  <Field name="combobox" label="ComboBox field">*/}
      {/*    <ComboBox>*/}
      {/*      <Item key="one">One</Item>*/}
      {/*      <Item key="two">Two</Item>*/}
      {/*      <Item key="three">Three</Item>*/}
      {/*    </ComboBox>*/}
      {/*  </Field>*/}
      {/*  <Field name="checkboxGroup" label="Checkbox group">*/}
      {/*    <CheckboxGroup orientation="horizontal">*/}
      {/*      <Checkbox value="one">One</Checkbox>*/}
      {/*      <Checkbox value="two">Two</Checkbox>*/}
      {/*      <Checkbox value="three">Three</Checkbox>*/}
      {/*    </CheckboxGroup>*/}
      {/*  </Field>*/}
      {/*  <Field name="radioGroup" label="Radio group">*/}
      {/*    <Radio.Group>*/}
      {/*      <Radio value="one">One</Radio>*/}
      {/*      <Radio value="two">Two</Radio>*/}
      {/*      <Radio value="three">Three</Radio>*/}
      {/*    </Radio.Group>*/}
      {/*  </Field>*/}
      {/*  <Field*/}
      {/*    name="checkbox"*/}
      {/*    rules={[{ required: true, message: 'This field is required' }]}*/}
      {/*  >*/}
      {/*    <Checkbox label="Checkbox field" />*/}
      {/*  </Field>*/}
      {/*  <Field*/}
      {/*    name="switch"*/}
      {/*    rules={[{ required: true, message: 'This field is required' }]}*/}
      {/*  >*/}
      {/*    <Switch label="Switch field" />*/}
      {/*  </Field>*/}
      {/*  <Field*/}
      {/*    name="number"*/}
      {/*    rules={[{ required: true, message: 'This field is required' }]}*/}
      {/*  >*/}
      {/*    <NumberInput label="Number field" />*/}
      {/*  </Field>*/}
      {/*  <Submit>Submit</Submit>*/}
      {/*</Form>*/}
    </>
  );
};

export const Default = Template.bind({});
Default.args = {};

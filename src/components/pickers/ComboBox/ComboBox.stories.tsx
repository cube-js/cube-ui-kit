import { ComboBox, Item } from '../../../index';
import { DollarCircleOutlined } from '@ant-design/icons';
import { SELECTED_KEY_ARG } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';

export default {
  title: 'Pickers/ComboBox',
  component: ComboBox,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    ...SELECTED_KEY_ARG,
  },
};

const Template = ({ icon, ...props }) => {
  return (
    <>
      <ComboBox
        id="name"
        icon={icon ? <DollarCircleOutlined /> : undefined}
        {...props}
        onSelectionChange={(query) =>
          console.log('onSelectionChange event', query)
        }
        onInputChange={(query) => console.log('onInputChange event', query)}
        width="200px"
      >
        <Item key="red">Red</Item>
        <Item key="orange">Orange</Item>
        <Item key="yellow">Yellow</Item>
        <Item key="green">Green</Item>
        <Item key="blue">Blue</Item>
        <Item key="purple">Purple</Item>
        <Item key="violet">Violet</Item>
      </ComboBox>
    </>
  );
};

export const Default = Template.bind({});
Default.args = {};

export const WithPlaceholder = Template.bind({});
WithPlaceholder.args = { placeholder: 'Enter a value' };

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultSelectedKey: 'purple' };

export const WithIcon = Template.bind({});
WithIcon.args = { icon: true };

export const Invalid = Template.bind({});
Invalid.args = { validationState: 'invalid' };

export const Valid = Template.bind({});
Valid.args = { validationState: 'valid' };

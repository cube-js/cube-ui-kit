import { ComboBox, Item } from '../../../index';
import { DollarCircleOutlined } from '@ant-design/icons';
import { SELECTED_KEY_ARG } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';

export default {
  title: 'UIKit/Pickers/ComboBox',
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
        prefix={icon ? <DollarCircleOutlined /> : null}
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

export const WithDefaultValue = Template.bind({});
WithDefaultValue.args = { defaultSelectedKey: 'purple' };

export const WithIcon = Template.bind({});
WithIcon.args = { icon: true };

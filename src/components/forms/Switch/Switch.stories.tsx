import { Switch } from './Switch';
import { IS_SELECTED_ARG } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';

export default {
  title: 'Forms/Switch',
  component: Switch,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    ...IS_SELECTED_ARG,
  },
};

const Template = (args) => (
  <Switch
    {...args}
    onChange={(query) => console.log('onChange event', query)}
  />
);

export const Default = Template.bind({});
Default.args = {
  label: 'Switch',
};

export const WithoutLabel = Template.bind({});
WithoutLabel.args = {
  label: '',
};

export const Checked = Template.bind({});
Checked.args = {
  isSelected: true,
};

export const Disabled = Template.bind({});
Disabled.args = {
  isDisabled: true,
};

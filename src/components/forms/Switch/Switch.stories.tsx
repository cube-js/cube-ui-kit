import { IS_SELECTED_ARG } from '../../../stories/FormFieldArgs';
import { baseProps } from '../../../stories/lists/baseProps';
import { Flow } from '../../layout/Flow';

import { Switch } from './Switch';

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
  <Flow gap="2x">
    <Switch
      {...args}
      defaultSelected={false}
      onChange={(query) => console.log('onChange event', query)}
    />
    <Switch
      {...args}
      defaultSelected={true}
      onChange={(query) => console.log('onChange event', query)}
    />
  </Flow>
);

export const Default = Template.bind({});
Default.args = {
  label: 'Switch',
};

export const Small = Template.bind({});
Small.args = {
  label: 'Switch',
  size: 'small',
};

export const WithoutLabel = Template.bind({});
WithoutLabel.args = {
  label: '',
};

export const Disabled = Template.bind({});
Disabled.args = {
  isDisabled: true,
};

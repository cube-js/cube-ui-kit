import { DollarCircleOutlined } from '@ant-design/icons';
import { Button } from './Button';
import { baseProps } from '../../../stories/lists/baseProps';

export default {
  title: 'UIKit/Actions/Button',
  component: Button,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    size: {
      defaultValue: undefined,
      control: {
        type: 'radio',
        options: [undefined, 'small'],
      },
    },
    type: {
      defaultValue: undefined,
      control: {
        type: 'radio',
        options: [
          undefined,
          'default',
          'primary',
          'outline',
          'clear',
          'neutral',
          'link',
        ],
      },
    },
    theme: {
      defaultValue: undefined,
      control: {
        type: 'radio',
        options: [undefined, 'danger'],
      },
    },
  },
};

const Template = ({ icon, label, onClick, ...props }) => (
  <Button
    icon={icon ? <DollarCircleOutlined /> : undefined}
    {...props}
    onPress={(e) => console.log('Press', e)}
  >
    {label}
  </Button>
);

export const Default = Template.bind({});
Default.args = {
  label: 'Button',
};

export const Primary = Template.bind({});
Primary.args = {
  type: 'primary',
  label: 'Button',
};

export const Outline = Template.bind({});
Outline.args = {
  type: 'outline',
  label: 'Button',
};

export const Clear = Template.bind({});
Clear.args = {
  type: 'clear',
  label: 'Button',
};

export const Neutral = Template.bind({});
Neutral.args = {
  label: 'Button',
  type: 'neutral',
};

export const Link = Template.bind({});
Link.args = {
  label: 'Link',
  type: 'link',
  selected: true,
};

export const WithIcon = Template.bind({});
WithIcon.args = {
  icon: true,
};

export const Loading = Template.bind({});
Loading.args = {
  icon: true,
  isLoading: true,
  label: '',
};

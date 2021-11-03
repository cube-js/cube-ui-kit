import { DollarCircleOutlined } from '@ant-design/icons';
import { Button } from './Button';
import {
  IS_DISABLED_ARG,
  IS_LOADING_ARG,
  SIZE_ARG,
} from '../../../stories/FormFieldArgs';

export default {
  title: 'UIKit/Actions/Button',
  component: Button,
  argTypes: {
    icon: {
      defaultValue: false,
      description: 'Show the icon',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    type: {
      defaultValue: 'default',
      description: 'A visual type of the button. Don\'t affect any logic',
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
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
      },
    },
    theme: {
      defaultValue: 'default',
      description: 'A visual type of the button. Don\'t affect any logic',
      control: {
        type: 'radio',
        options: [undefined, 'danger'],
      },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
      },
    },
    isSelected: {
      control: 'boolean',
      description: 'Selected state for Tab type buttons',
      defaultValue: false,
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    ...IS_LOADING_ARG,
    ...IS_DISABLED_ARG,
    ...SIZE_ARG,
    radius: {
      defaultValue: undefined,
      control: {
        type: 'radio',
        options: [undefined, '0', '1r', 'round'],
      },
      table: {
        type: { summary: 'string|number' },
        defaultValue: { summary: '1r' },
      },
    },
    label: {
      defaultValue: 'Button',
      control: 'text',
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

export const Item = Template.bind({});
Item.args = {
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

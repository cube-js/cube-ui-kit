import { Link } from './Link';

export default {
  title: 'UIKit/Navigation/Link',
  component: Link,
  argTypes: {
    isDisabled: {
      defaultValue: false,
      description: 'Disables the button.',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    label: {
      defaultValue: 'Button',
      control: 'text',
    },
  },
};

const Template = ({ isDisabled, label }) => (
  <Link
    isDisabled={isDisabled}
    onPress={() => console.log('Press')}
    to="!https://cube.dev"
  >
    {label}
  </Link>
);

export const Default = Template.bind({});
Default.args = {
  label: 'Link',
};

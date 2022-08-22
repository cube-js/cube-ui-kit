import { baseProps } from '../../../stories/lists/baseProps';

import { Link } from './Link';

export default {
  title: 'Navigation/Link',
  component: Link,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    label: {
      defaultValue: 'Button',
      control: 'text',
    },
  },
};

const Template = ({ isDisabled, label }) => (
  <Link
    isDisabled={isDisabled}
    to="!https://cube.dev"
    onPress={() => console.log('Press')}
  >
    {label}
  </Link>
);

export const Default = Template.bind({});
Default.args = {
  label: 'Link',
};

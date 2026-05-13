import { baseProps } from '../../../stories/lists/baseProps';
import { Alert } from '../../content/Alert';

import { Link } from './Link';

import type { StoryFn } from '@storybook/react-vite';

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

export const Default: StoryFn = Template.bind({});
Default.args = {
  label: 'Link',
};

// Verifies the inline `Link` baseline-aligns with surrounding text
// (Button.tsx → `verticalAlign: { '': 'bottom', 'type=link': 'baseline' }`).
export const InlineInsideAlert: StoryFn = () => (
  <Alert theme="note">
    Some text. See <Link to="!https://example.com">the documentation</Link> for
    details.
  </Alert>
);

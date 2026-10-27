import { NO_SNAPSHOT } from '../../../stories/chromatic';
import { baseProps } from '../../../stories/lists/baseProps';
import { Button } from '../../actions/Button/Button';
import { Space } from '../../layout/Space';
import { Paragraph } from '../Paragraph';

import { CubeDividerProps, Divider } from './Divider';

import type { Meta, StoryFn } from '@storybook/react-vite';

export default {
  title: 'Content/Divider',
  component: Divider,
  parameters: { controls: { exclude: baseProps } },
  argTypes: {
    /* Content */
    children: {
      control: { type: 'text' },
      description:
        'Text shown between two lines. It also names the separator for screen readers, unless `aria-label` or `aria-labelledby` names it.',
      table: { type: { summary: 'ReactNode' } },
    },
    /* Presentation */
    orientation: {
      control: { type: 'radio' },
      options: ['horizontal', 'vertical'],
      description:
        'The direction of the line. A vertical divider stretches to the height of its flex or grid row, even when the row centers its items. Elsewhere, or to make it shorter, give it a `height`.',
      table: {
        defaultValue: { summary: 'horizontal' },
        type: { summary: "'horizontal' | 'vertical'" },
      },
    },
  },
} satisfies Meta<typeof Divider>;

const Template: StoryFn<CubeDividerProps> = (args) => (
  <Space flow="column">
    <Paragraph>Section 1</Paragraph>
    <Divider {...args} />
    <Paragraph>Section 2</Paragraph>
  </Space>
);

export const Default = Template.bind({});
// The plain horizontal divider is the first row of `Variants`.
Default.parameters = NO_SNAPSHOT;

export const Variants: StoryFn<CubeDividerProps> = () => (
  <Space flow="column" gap="3x">
    <Divider />
    <Divider>or</Divider>
    <Space placeItems="center" gap="1.5x">
      <Button>Edit</Button>
      <Divider orientation="vertical" />
      <Button>Delete</Button>
    </Space>
    <Space height="12x" gap="1.5x">
      <Paragraph>Sign in with Google</Paragraph>
      <Divider orientation="vertical">or</Divider>
      <Paragraph>Sign in with email</Paragraph>
    </Space>
  </Space>
);

Variants.parameters = {
  docs: {
    description: {
      story:
        'Plain and text dividers in both orientations. A vertical divider stretches to the height of its row, even when the row centers its items.',
    },
  },
};

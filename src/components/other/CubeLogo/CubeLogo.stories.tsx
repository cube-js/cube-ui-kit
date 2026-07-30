import { Meta, StoryObj } from '@storybook/react-vite';

import { Text } from '../../content/Text';
import { Flow } from '../../layout/Flow';
import { Space } from '../../layout/Space';

import { CubeFullLogo, CubeLogo } from './CubeLogo';

const meta: Meta<typeof CubeLogo> = {
  title: 'Other/CubeLogo',
  component: CubeLogo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof CubeLogo>;

export const Default: Story = {};

export const FullLogo: StoryObj<typeof CubeFullLogo> = {
  render: (args) => <CubeFullLogo {...args} />,
};

/** `size` drives both axes on the mark, and height only on the full logo. */
export const Sizes: Story = {
  render: () => (
    <Flow gap="3x">
      <Space gap="2x" placeItems="center start">
        {['16px', '24px', '32px', '48px'].map((size) => (
          <CubeLogo key={size} size={size} />
        ))}
      </Space>
      <Flow gap="2x">
        {['16px', '24px', '32px', '48px'].map((size) => (
          <CubeFullLogo key={size} size={size} />
        ))}
      </Flow>
    </Flow>
  ),
};

/**
 * Both marks inherit `currentColor`, so they take the surrounding text colour
 * unless given an explicit one.
 */
export const Colors: Story = {
  render: () => (
    <Flow gap="2x">
      <Space gap="2x" placeItems="center start">
        <CubeFullLogo size="24px" />
        <Text>inherits `currentColor`</Text>
      </Space>
      <Space gap="2x" placeItems="center start">
        <CubeFullLogo color="#purple" size="24px" />
        <Text>color="#purple"</Text>
      </Space>
      <Space gap="2x" placeItems="center start">
        <CubeFullLogo color="#danger" size="24px" />
        <Text>color="#danger"</Text>
      </Space>
    </Flow>
  ),
};

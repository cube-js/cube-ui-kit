import { Meta, StoryObj } from '@storybook/react-vite';

import {
  withDarkScheme,
  withHighContrast,
} from '../../../stories/decorators/withColorScheme';
import { Text } from '../../content/Text';
import { Flow } from '../../layout/Flow';
import { Space } from '../../layout/Space';
import { LoadingAnimation } from '../../status/LoadingAnimation';

import { NoDataIcon } from './NoDataIcon';

const meta: Meta<typeof NoDataIcon> = {
  title: 'Other/NoDataIcon',
  component: NoDataIcon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    size: '8x',
  },
};

export default meta;
type Story = StoryObj<typeof NoDataIcon>;

export const Default: Story = {};

/**
 * `size` drives both axes — the artwork is square. Shown at the range it is
 * meant for: an inline empty row through a full-page empty state.
 */
export const Sizes: Story = {
  render: () => (
    <Space gap="2x" placeItems="center start">
      {['4x', '6x', '8x', '12x'].map((size) => (
        <NoDataIcon key={size} size={size} />
      ))}
    </Space>
  ),
};

/**
 * The whole reason it shares `LoadingAnimation`'s tokens: a table that is
 * loading and a table that is empty have to read as the same object under the
 * same light, not as two different drawings that happen to be nearby.
 */
export const WithLoadingAnimation: Story = {
  render: () => (
    <Space gap="4x" placeItems="center">
      <Flow gap="1x" placeItems="center">
        <LoadingAnimation size="large" />
        <Text preset="t4">LoadingAnimation</Text>
      </Flow>
      <Flow gap="1x" placeItems="center">
        <NoDataIcon size="96px" />
        <Text preset="t4">NoDataIcon</Text>
      </Flow>
    </Space>
  ),
};

/**
 * The three faces are pinned by a contrast floor against `#surface`, so they
 * hold the same separation from the page in every scheme rather than flattening
 * out in dark — this story and the next are what that claim is checked against.
 */
export const DarkScheme: Story = {
  decorators: [withDarkScheme],
};

export const HighContrast: Story = {
  decorators: [withHighContrast],
};

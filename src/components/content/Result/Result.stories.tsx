import { IconBulb, IconLock } from '@tabler/icons-react';

import { Icon } from '../../../icons/Icon';
import { Button } from '../../actions/Button';
import { Space } from '../../layout/Space';
import { Text } from '../Text';
import { Title } from '../Title';

import { CubeResultProps, Result } from './Result';

import type { Meta, StoryFn } from '@storybook/react-vite';

export default {
  title: 'Content/Result',
  component: Result,
  argTypes: {
    /* Content */
    title: {
      control: 'text',
      description: 'Main title text',
    },
    subtitle: {
      control: 'text',
      description: 'Secondary text below the title',
    },

    /* Presentation */
    status: {
      control: 'radio',
      options: [
        undefined,
        'info',
        'success',
        'warning',
        'error',
        404,
        403,
        500,
      ],
      description: 'Predefined status with corresponding icon',
      table: {
        defaultValue: { summary: 'info' },
      },
    },
    isCompact: {
      control: 'boolean',
      description: 'Use a compact horizontal layout',
      table: {
        defaultValue: { summary: false },
      },
    },
  },
} as Meta<typeof Result>;

const Template: StoryFn<CubeResultProps> = ({ children, ...props }) => {
  return <Result {...props}>{children}</Result>;
};

export const Success = Template.bind({});
Success.args = {
  status: 'success',
  title: 'Successfully Purchased Cloud Server ECS!',
  subtitle:
    'Order number: 2017182818828182881 Cloud server configuration takes 1-5 minutes, please wait.',
  children: (
    <Space>
      <Button type="primary">Go Console</Button>
      <Button type="secondary">Buy Again</Button>
    </Space>
  ),
};

export const Info = Template.bind({});
Info.args = {
  status: 'info',
  title: 'Your operation has been executed',
  children: <Button type="primary">Go Console</Button>,
};

export const Warning = Template.bind({});
Warning.args = {
  status: 'warning',
  title: 'There are some problems with your operation',
  children: <Button type="primary">Go Console</Button>,
};

export const Error = Template.bind({});
Error.args = {
  status: 'error',
  title: 'Submission Failed',
  subtitle:
    'Please check and modify the following information before resubmitting.',
  children: (
    <Space>
      <Button type="primary">Go Console</Button>
      <Button type="secondary">Buy Again</Button>
    </Space>
  ),
};

export const CustomIcon = Template.bind({});
CustomIcon.args = {
  title: 'Access is denied!',
  subtitle: 'Request access from the administrator.',
  icon: (
    <Icon color="#warning">
      <IconLock />
    </Icon>
  ),
  children: <Button type="secondary">Request</Button>,
};

export const CustomTitle = Template.bind({});
CustomTitle.args = {
  title: (
    <Title level={3} preset="h2">
      Advice
    </Title>
  ),
  subtitle: (
    <Text.Highlight>
      Complete your profile to increase search relevancy.
    </Text.Highlight>
  ),
  icon: <IconBulb />,
  children: <Button type="primary">Complete Now</Button>,
};

export const Compact = Template.bind({});
Compact.args = {
  isCompact: true,
  status: 'success',
  title: 'Successfully Purchased Cloud Server ECS!',
  subtitle:
    'Order number: 2017182818828182881 Cloud server configuration takes 1-5 minutes, please wait.',
  children: (
    <Space>
      <Button type="primary">Go Console</Button>
      <Button type="secondary">Buy Again</Button>
    </Space>
  ),
};

export const WidthLimit: StoryFn<CubeResultProps> = (args) => (
  <div style={{ width: '100%', minHeight: 320, border: '1px dashed #ccc' }}>
    <Result {...args} />
  </div>
);
WidthLimit.args = {
  status: 'info',
  title: 'Even with a very long heading the layout stays readable',
  subtitle:
    'The Result component caps its width at 80ch so multi-line copy wraps into a comfortable reading column instead of stretching across the full width of a wide container.',
};
WidthLimit.parameters = {
  docs: {
    description: {
      story:
        'The default `width: max 80ch` on `Result` constrains long titles and subtitles to a comfortable reading width even inside a much wider parent.',
    },
  },
};

export const CustomWidth = Template.bind({});
CustomWidth.args = {
  status: 'info',
  title: 'Override the default width',
  subtitle:
    'Pass a `width` prop (or `styles={{ width: ... }}`) to override the built-in 80ch cap.',
  width: 'max 40ch',
};

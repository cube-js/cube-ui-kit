import { StoryFn } from '@storybook/react';
import { IconBulb, IconLock } from '@tabler/icons-react';

import {
  Button,
  CubeResultProps,
  Icon,
  Result,
  Space,
  Text,
  Title,
} from '../index';

const Template: StoryFn<CubeResultProps> = ({ children, ...props }) => {
  return <Result {...props}>{children}</Result>;
};

export default {
  title: 'Content/Result',
  component: Result,
};

export const Success = {
  render: Template.bind({}),

  args: {
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
  },
};

export const Info = {
  render: Template.bind({}),

  args: {
    status: 'info',
    title: 'Your operation has been executed',
    children: <Button type="primary">Go Console</Button>,
  },
};

export const Warning = {
  render: Template.bind({}),

  args: {
    status: 'warning',
    title: 'There are some problems with your operation',
    children: <Button type="primary">Go Console</Button>,
  },
};

export const Error = {
  render: Template.bind({}),

  args: {
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
  },
};

export const CustomIcon = {
  render: Template.bind({}),

  args: {
    title: 'Access is denied!',
    subtitle: 'Request access from the administrator.',

    icon: (
      <Icon color="#note">
        <IconLock />
      </Icon>
    ),

    children: <Button type="secondary">Request</Button>,
  },
};

export const CustomTitle = {
  render: Template.bind({}),

  args: {
    title: (
      <Title level={3} preset="h2">
        Advice
      </Title>
    ),
    subtitle: (
      <Text.Selection>
        Complete your profile to increase search relevancy.
      </Text.Selection>
    ),

    icon: <IconBulb />,

    children: <Button type="primary">Complete Now</Button>,
  },
};

export const Compact = {
  render: Template.bind({}),

  args: {
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
  },
};

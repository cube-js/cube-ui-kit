import { expect } from '@storybook/test';
import { Meta, StoryFn } from '@storybook/react';
import { userEvent, within } from '@storybook/test';
import { BellOutlined } from '@ant-design/icons';

import { Button } from '../../actions';

import { Toast } from './Toast';
import { CubeToastsApiProps } from './types';
import { useToastsApi } from './use-toasts-api';

export default {
  title: 'Overlays/Toasts',
  component: Toast,
  args: {
    type: 'success',
    description: 'Copied to clipboard',
  },
} as Meta<CubeToastsApiProps>;

export const UseToast: StoryFn<CubeToastsApiProps> = (args) => {
  const { toast } = useToastsApi();

  return <Button onPress={() => toast({ ...args })}>Click Me!</Button>;
};

UseToast.play = async ({ canvasElement }) => {
  const { getByRole, getByTestId } = within(canvasElement);

  const button = getByRole('button');
  await userEvent.click(button);

  const notification = getByTestId('FloatingNotification');

  await expect(notification).toBeInTheDocument();
};

export const AsComponent: StoryFn<CubeToastsApiProps> = (args) => {
  return <Toast {...args} />;
};

export const AllTypes: StoryFn<CubeToastsApiProps> = () => (
  <>
    <Toast.Success description="Copied to clipboard" />
    <Toast.Danger description="Copied to clipboard" />
    <Toast.Attention description="Copied to clipboard" />
  </>
);

export const CustomIcon = AsComponent.bind({});
CustomIcon.args = {
  icon: <BellOutlined style={{ display: 'flex', alignSelf: 'center' }} />,
};

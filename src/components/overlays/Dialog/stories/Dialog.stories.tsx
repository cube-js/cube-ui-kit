import { ModalProvider } from '@react-aria/overlays';
import { within, userEvent } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { Story } from '@storybook/react';

import { CubeDialogProps } from '../Dialog';
import { CubeDialogTriggerProps } from '../DialogTrigger';
import {
  Button,
  Content,
  Dialog,
  DialogTrigger,
  Text,
  Footer,
  Header,
  Paragraph,
  Title,
} from '../../../../index';
import { baseProps } from '../../../../stories/lists/baseProps';

export default {
  title: 'Overlays/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
    controls: {
      exclude: baseProps,
    },
  },
};

const Template: Story<
  CubeDialogTriggerProps & { size: CubeDialogProps['size'] }
> = ({ size, ...props }) => {
  return (
    <ModalProvider>
      <DialogTrigger {...props}>
        <Button>Click me!</Button>
        {(close) => (
          <Dialog size={size}>
            <Header>
              <Title>Modal title</Title>
              <Text>Header</Text>
            </Header>
            <Content>
              <Paragraph>Test content</Paragraph>
              <Paragraph>Test content</Paragraph>
            </Content>
            <Footer>
              <Button.Group>
                <Button type="primary" onPress={close}>
                  Action
                </Button>
                <Button onPress={close}>Sec</Button>
                <Button onPress={close}>Cancel</Button>
              </Button.Group>
              <Text>Footer</Text>
            </Footer>
          </Dialog>
        )}
      </DialogTrigger>
    </ModalProvider>
  );
};

export const Default: typeof Template = Template.bind({});
Default.play = async ({ canvasElement }) => {
  const { getByRole } = within(canvasElement);
  await userEvent.click(getByRole('button'));
  await expect(getByRole('dialog')).toBeInTheDocument();
};

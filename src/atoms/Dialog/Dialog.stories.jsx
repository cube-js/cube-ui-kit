import React from 'react';
import { ModalProvider } from '@react-aria/overlays';
import {
  Button,
  ButtonGroup,
  Content,
  Dialog,
  DialogTrigger,
  Divider,
  Footer,
  Header,
  Paragraph,
  Title,
} from '../../index';

window.Dialog = Dialog;

export default {
  title: 'UIKit/Atoms/Dialog',
  component: Dialog,
  argTypes: {
    size: {
      control: {
        type: 'inline-radio',
        options: [undefined, 'small', 'medium', 'large'],
      },
      description: 'Type of the dialog',
      defaultValue: undefined,
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'small' },
      },
    },
    type: {
      control: {
        type: 'inline-radio',
        options: [undefined, 'modal', 'popover', 'tray', 'fullscreen', 'fullscreenTakeover'],
      },
      description: 'Type of the dialog',
      defaultValue: undefined,
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'modal' },
      },
    },
    mobileType: {
      control: {
        type: 'inline-radio',
        options: [undefined, 'modal', 'popover', 'tray', 'fullscreen', 'fullscreenTakeover'],
      },
      description: 'Type of the dialog for mobile devices',
      defaultValue: undefined,
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'modal' },
      },
    },
    isDismissable: {
      defaultValue: false,
      description: 'Whether the dialog can be dismissed.',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    placement: {
      control: {
        type: 'inline-radio',
        options: [undefined, 'top', 'bottom'],
      },
      description: 'The default placement of the dialog.',
      defaultValue: undefined,
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'bottom' },
      },
    },
  },
};

const Template = ({ size, ...props }) => {
  return (
    <ModalProvider>
      <DialogTrigger {...props} onDismiss={() => {
        console.log('dismiss');
      }}>
        <Button margin="22x top">Click me!</Button>
        {(close) => (
          <Dialog size={size}>
            <Title>Modal title</Title>
            <Header>
              Header
            </Header>
            <Divider/>
            <Content>
              <Paragraph>Test content</Paragraph>
              <Paragraph>Test content</Paragraph>
            </Content>
            <Footer>
              Footer
            </Footer>
            <ButtonGroup>
              <Button onPress={close} type="primary">Action</Button>
              <Button onPress={close}>Sec</Button>
              <Button onPress={close}>Cancel</Button>
            </ButtonGroup>
          </Dialog>
        )}
      </DialogTrigger>
    </ModalProvider>
  );
};

export const Default = Template.bind({});
Default.args = {};

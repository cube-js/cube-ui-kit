import React from 'react';
import { AlertDialog, Button, DialogTrigger } from '../../index';
import { ModalProvider } from '@react-aria/overlays';

export default {
  title: 'UIKit/Molecules/AlertDialog',
  component: AlertDialog,
  argTypes: {
    danger: {
      defaultValue: false,
      description: 'Whether the dialog is styled as danger alert.',
      control: {
        type: 'boolean',
      },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
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
        options: [
          undefined,
          'modal',
          'popover',
          'tray',
          'fullscreen',
          'fullscreenTakeover',
        ],
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
        options: [
          undefined,
          'modal',
          'popover',
          'tray',
          'fullscreen',
          'fullscreenTakeover',
        ],
      },
      description: 'Type of the dialog for mobile devices',
      defaultValue: undefined,
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'modal' },
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
    primaryActionProps: {
      defaultValue: {
        label: 'Ok',
      },
      control: 'object',
    },
    secondaryActionProps: {
      defaultValue: undefined,
      control: 'object',
    },
    cancelProps: {
      defaultValue: undefined,
      control: 'object',
    },
    title: {
      defaultValue: 'Dialog title',
      control: 'text',
    },
    content: {
      defaultValue: 'Are you sure about this?',
      control: 'text',
    },
  },
};

const Template = (props) => {
  let {
    content,
    type,
    mobileType,
    placement,
    isDismissable,
    primaryProps,
    secondaryProps,
    cancelProps,
    ...args
  } = props;
  const triggerProps = {
    type,
    mobileType,
    placement,
    isDismissable,
  };

  return (
    <ModalProvider>
      <DialogTrigger {...triggerProps} onDismiss={() => console.log('dismiss')}>
        <Button>Open Modal</Button>
        {(close) => (
          <AlertDialog
            {...args}
            primaryProps={{
              ...primaryProps,
              onPress() {
                console.log('primary');
                close();
              },
            }}
            secondaryProps={
              secondaryProps
                ? {
                    ...secondaryProps,
                    onPress() {
                      console.log('secondary');
                      close();
                    },
                  }
                : null
            }
            cancelProps={
              cancelProps
                ? {
                    ...cancelProps,
                    onPress() {
                      console.log('cancel');
                      close();
                    },
                  }
                : null
            }
          >
            {content}
          </AlertDialog>
        )}
      </DialogTrigger>
    </ModalProvider>
  );
};

export const Default = Template.bind({});
Default.args = {};

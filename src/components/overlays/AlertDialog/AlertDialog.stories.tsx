import { AlertDialog, Button, DialogTrigger, Paragraph } from '../../../index';
import { ModalProvider } from '@react-aria/overlays';
import { baseProps } from '../../../stories/lists/baseProps';
import { useAlertDialogAPI } from './AlertDialogApiProvider';
import { useEffect, useState } from 'react';

export default {
  title: 'Overlays/AlertDialog',
  component: AlertDialog,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
};

const Template = (props) => {
  const {
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
      <DialogTrigger
        {...triggerProps}
        onDismiss={(action) => console.log('onDismiss event', action)}
      >
        <Button>Open Modal</Button>
        {(close) => (
          <AlertDialog
            title="Title"
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

const ApiTemplate = (args) => {
  const dialogAPI = useAlertDialogAPI();

  return (
    <Button
      {...args}
      onPress={() => {
        const promise = dialogAPI.open({
          title: 'Main Header',
          actions: { cancel: true },
          content: <Paragraph>Test content</Paragraph>,
        });

        dialogAPI.open({ content: <Paragraph>Test content 2</Paragraph> });

        promise.then((status) => {
          console.log(`closed, ${status}`);
        });
      }}
    >
      Open Modal
    </Button>
  );
};

const ApiCancelTemplate = (args) => {
  const [, setState] = useState(0);
  const dialogAPI = useAlertDialogAPI();

  useEffect(() => {
    const cancelDialog = new AbortController();

    const openedDialog = dialogAPI.open(
      {
        title: 'Test',
        content: <Paragraph>Test Content</Paragraph>,
      },
      { cancelToken: cancelDialog.signal },
    );

    openedDialog
      .then((status) => console.log(`closed, ${status}`))
      .catch((e) => console.log(`failed, ${e}`));

    return () => cancelDialog.abort();
  });

  useEffect(() => {
    const id = setInterval(() => setState((current) => current + 1), 5000);

    return () => clearInterval(id);
  }, []);

  return (
    <Button
      {...args}
      onPress={() => {
        const promise = dialogAPI.open({
          content: <Paragraph>Test content</Paragraph>,
        });

        promise.then(() => console.log('closed'));
      }}
    >
      Open Modal
    </Button>
  );
};

export const UsingApi = ApiTemplate.bind({});
// export const UsingApiWithCancel = ApiCancelTemplate.bind({});

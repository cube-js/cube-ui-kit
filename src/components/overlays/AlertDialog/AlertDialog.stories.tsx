import { AlertDialog, Button, DialogTrigger } from '../../../index';
import { ModalProvider } from '@react-aria/overlays';
import { baseProps } from '../../../stories/lists/baseProps';

export default {
  title: 'UIKit/Overlays/AlertDialog',
  component: AlertDialog,
  parameters: {
    controls: {
      exclude: baseProps,
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

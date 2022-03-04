import {
  AlertDialog,
  Button,
  Content,
  DialogTrigger,
  Paragraph,
} from '../../../index';
import { ModalProvider } from '@react-aria/overlays';
import { baseProps } from '../../../stories/lists/baseProps';
import { useAlertDialogApi } from './AlertDialogApiProvider';

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
  const api = useAlertDialogApi();

  return (
    <Button
      {...args}
      onPress={() => {
        const { promise } = api.open({
          children: (
            <Content>
              <Paragraph>Test content</Paragraph>
            </Content>
          ),
        });

        promise.then(() => console.log('closed'));
      }}
    >
      Open Modal
    </Button>
  );
};

export const UsingApi = ApiTemplate.bind({});

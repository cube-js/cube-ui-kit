import { ModalProvider } from '@react-aria/overlays';
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
} from '../../../index';
import { baseProps } from '../../../stories/lists/baseProps';

export default {
  title: 'UIKit/Overlays/Dialog',
  component: Dialog,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
};

const Template = ({ size, ...props }) => {
  return (
    <ModalProvider>
      <DialogTrigger
        {...props}
        onDismiss={() => {
          console.log('onDismiss event');
        }}
        // styles={{
        //   transform: {
        //     '': 'translate(100%, 0)',
        //     open: 'translate(0, 0)',
        //   },
        // }}
      >
        <Button margin="30x top">Click me!</Button>
        {(close) => (
          <Dialog
            size={size}
            // styles={{
            //   width: '320px',
            //   placeSelf: 'end',
            //   height: '@cube-visual-viewport-height',
            // }}
          >
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
                <Button onPress={close} type="primary">
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

export const Default = Template.bind({});
Default.args = {};

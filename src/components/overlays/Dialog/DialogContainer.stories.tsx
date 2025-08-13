import { StoryFn } from '@storybook/react-vite';
import { useState } from 'react';

import { baseProps } from '../../../stories/lists/baseProps';
import { Button } from '../../actions/Button/Button';
import { Content } from '../../content/Content';
import { Footer } from '../../content/Footer';
import { Header } from '../../content/Header';
import { Paragraph } from '../../content/Paragraph';
import { Title } from '../../content/Title';

import { Dialog } from './Dialog';
import { CubeDialogContainerProps, DialogContainer } from './DialogContainer';

export default {
  title: 'Overlays/DialogContainer',
  component: DialogContainer,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    /* Content */
    children: {
      control: { type: null },
      description: 'The Dialog to display, if any',
    },

    /* Presentation */
    type: {
      options: ['modal', 'fullscreen', 'fullscreenTakeover', 'panel'],
      control: { type: 'radio' },
      description: 'The type of Dialog that should be rendered',
      table: {
        defaultValue: { summary: 'modal' },
      },
    },

    /* State */
    isDismissable: {
      control: { type: 'boolean' },
      description: 'Whether the Dialog is dismissible',
      table: {
        defaultValue: { summary: false },
      },
    },
    isKeyboardDismissDisabled: {
      control: { type: 'boolean' },
      description:
        'Whether pressing the escape key to close the dialog should be disabled',
      table: {
        defaultValue: { summary: false },
      },
    },
    isOpen: {
      control: { type: 'boolean' },
      description: 'Whether the modal is open or not',
    },

    /* Events */
    onDismiss: {
      action: 'dismiss',
      description:
        'Handler called when the x button of a dismissible Dialog is clicked',
      control: { type: null },
    },

    /* Other */
    hideOnClose: {
      control: { type: 'boolean' },
      description: 'Whether the dialog should be hidden when closed',
      table: {
        defaultValue: { summary: false },
      },
    },
  },
};

const Template: StoryFn<CubeDialogContainerProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button onPress={() => setIsOpen(true)}>Open Dialog</Button>
      <DialogContainer
        {...props}
        isDismissable
        isOpen={isOpen}
        onDismiss={(action) => {
          console.log('dismiss', action);
          setIsOpen(false);
        }}
      >
        <Dialog>
          <Header>
            <Title>Example Dialog</Title>
          </Header>
          <Content>
            <Paragraph>
              This is an example dialog managed by DialogContainer. It's useful
              when there is no trigger element or when the trigger unmounts
              while the dialog is open.
            </Paragraph>
          </Content>
          <Footer>
            <Button onPress={() => setIsOpen(false)}>Close</Button>
          </Footer>
        </Dialog>
      </DialogContainer>
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {};

import { StoryFn } from '@storybook/react-vite';
import { useState } from 'react';
import { userEvent, within } from 'storybook/test';

import { waitForOverlay } from '../../../stories/interactions';
import { baseProps } from '../../../stories/lists/baseProps';
import { Button } from '../../actions/Button/Button';
import { Block } from '../../Block';
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
      exclude: baseProps.filter((prop) => prop !== 'styles'),
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
      options: ['modal', 'tray', 'fullscreen', 'fullscreenTakeover', 'panel'],
      control: { type: 'radio' },
      description: 'The type of Dialog that should be rendered',
      table: {
        defaultValue: { summary: 'modal' },
      },
    },

    styles: {
      control: { type: 'object' },
      description:
        'Styles for the overlay content shell; style the child Dialog separately',
      table: { type: { summary: 'Styles' } },
    },

    /* State */
    isDismissable: {
      control: { type: 'boolean' },
      description: 'Whether the Dialog is dismissible',
      table: {
        defaultValue: { summary: true },
      },
    },
    confirmDismiss: {
      control: { type: 'boolean' },
      description:
        'Whether Escape, an outside click and the close button ask "Discard changes?" first. Unset, they ask while a DialogForm inside has unsaved edits. Explicit actions never ask',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'while a DialogForm has unsaved edits' },
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
      description:
        'Whether the dialog should be hidden when closed. Focus moves as for a dialog that mounts on open: in on every open, and on close back to the element that opened it, or to the trigger of the menu or popover it sat in once that has closed. The docs list what still differs',
      table: {
        defaultValue: { summary: false },
      },
    },
  },
};

const Template: StoryFn<CubeDialogContainerProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Block>
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
    </Block>
  );
};

export const Default = Template.bind({});
Default.args = {};

// `DialogContainer` holds its dialog closed until `isOpen` flips. Without this
// the file's only story photographs a closed button: no coverage of the dialog
// at all, and an image identical to `DialogTrigger`'s story.
Default.play = async ({ canvasElement }) => {
  const { findByRole } = within(canvasElement);

  await userEvent.click(await findByRole('button', { name: 'Open Dialog' }));

  await waitForOverlay('dialog');
};

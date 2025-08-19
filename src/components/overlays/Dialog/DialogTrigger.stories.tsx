import { StoryFn } from '@storybook/react';

import { baseProps } from '../../../stories/lists/baseProps';
import { Button } from '../../actions/Button/Button';
import { Content } from '../../content/Content';
import { Header } from '../../content/Header';
import { Paragraph } from '../../content/Paragraph';
import { Title } from '../../content/Title';

import { Dialog } from './Dialog';
import { CubeDialogTriggerProps, DialogTrigger } from './DialogTrigger';

export default {
  title: 'Overlays/DialogTrigger',
  component: DialogTrigger,
  parameters: {
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    /* Content */
    children: {
      control: { type: null },
      description: 'The Dialog and its trigger element',
    },

    /* Presentation */
    type: {
      options: [
        'modal',
        'popover',
        'tray',
        'fullscreen',
        'fullscreenTakeover',
        'panel',
      ],
      control: { type: 'radio' },
      description: 'The type of Dialog that should be rendered',
      table: {
        defaultValue: { summary: 'modal' },
      },
    },
    mobileType: {
      options: [
        'modal',
        'tray',
        'fullscreen',
        'fullscreenTakeover',
        'panel',
        'popover',
      ],
      control: { type: 'radio' },
      description:
        'The type of Dialog that should be rendered when on a mobile device',
    },
    placement: {
      options: [
        'top',
        'bottom',
        'left',
        'right',
        'top start',
        'top end',
        'bottom start',
        'bottom end',
        'left top',
        'left bottom',
        'right top',
        'right bottom',
      ],
      control: { type: 'select' },
      description: 'The placement of the dialog relative to its trigger',
    },
    hideArrow: {
      control: { type: 'boolean' },
      description: "Whether a popover type Dialog's arrow should be hidden",
      table: {
        defaultValue: { summary: false },
      },
    },
    mobileViewport: {
      control: { type: 'number' },
      description: 'The screen breakpoint for the mobile type',
      table: {
        defaultValue: { summary: 700 },
      },
    },

    /* State */
    isDismissable: {
      control: { type: 'boolean' },
      description: 'Whether a modal type Dialog should be dismissable',
      table: {
        defaultValue: { summary: true },
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
      description: 'Whether the dialog is open (controlled)',
    },
    defaultOpen: {
      control: { type: 'boolean' },
      description: 'Whether the dialog is open by default (uncontrolled)',
      table: {
        defaultValue: { summary: false },
      },
    },

    /* Position */
    offset: {
      control: { type: 'number' },
      description: 'The additional offset applied along the main axis',
      table: {
        defaultValue: { summary: 8 },
      },
    },
    crossOffset: {
      control: { type: 'number' },
      description: 'The additional offset applied along the cross axis',
      table: {
        defaultValue: { summary: 0 },
      },
    },
    containerPadding: {
      control: { type: 'number' },
      description:
        'The padding between the edge of the overlay and the boundary',
      table: {
        defaultValue: { summary: 12 },
      },
    },
    shouldFlip: {
      control: { type: 'boolean' },
      description:
        'Whether the overlay should flip positions when insufficient space',
      table: {
        defaultValue: { summary: true },
      },
    },

    /* Events */
    onOpenChange: {
      action: 'openChange',
      description: 'Callback fired when the dialog open state changes',
      control: { type: null },
    },
    onDismiss: {
      action: 'dismiss',
      description: 'Callback fired when the dialog is dismissed',
      control: { type: null },
    },

    /* Other */
    targetRef: {
      control: { type: null },
      description:
        'The ref of the element the Dialog should visually attach itself to',
    },
    styles: {
      control: { type: null },
      description: 'The style map for the overlay',
    },
    shouldCloseOnInteractOutside: {
      control: { type: null },
      description:
        'Function to determine if overlay should close on outside interaction',
    },
  },
};

const Template: StoryFn<CubeDialogTriggerProps> = (props) => (
  <DialogTrigger
    {...props}
    onOpenChange={(isOpen) => console.log('openChange', isOpen)}
    onDismiss={(action) => console.log('dismiss', action)}
  >
    <Button>Open Dialog</Button>
    <Dialog>
      <Header>
        <Title>Example Dialog</Title>
      </Header>
      <Content>
        <Paragraph>
          This is an example dialog content. You can place any content here.
        </Paragraph>
      </Content>
    </Dialog>
  </DialogTrigger>
);

export const Default = Template.bind({});
Default.args = {};

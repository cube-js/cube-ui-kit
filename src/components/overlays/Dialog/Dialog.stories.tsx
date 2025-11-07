import { FocusableRefValue } from '@react-types/shared';
import { StoryFn } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { useRef, useState } from 'react';

import {
  Button,
  Content,
  Dialog,
  DialogTrigger,
  DirectionIcon,
  Footer,
  Header,
  Menu,
  MenuTrigger,
  Paragraph,
  Select,
  Space,
  Text,
  TextInput,
  Title,
} from '../../../index';
import { baseProps } from '../../../stories/lists/baseProps';
import { timeout } from '../../../utils/promise';

import { CubeDialogProps } from './Dialog';
import { CubeDialogTriggerProps } from './DialogTrigger';

export default {
  title: 'Overlays/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
    controls: {
      exclude: baseProps,
    },
  },
  argTypes: {
    /* Content */
    children: {
      control: { type: null },
      description: 'Dialog content (Header, Content, Footer, etc.)',
    },
    /* Presentation */
    size: {
      options: ['small', 'medium', 'large', 'S', 'M', 'L'],
      control: { type: 'radio' },
      description: 'Dialog size',
      table: {
        defaultValue: { summary: 'S' },
      },
    },
    styles: {
      control: { type: null },
      description: 'Custom styles for the dialog root',
    },
    closeButtonStyles: {
      control: { type: null },
      description: 'Custom styles for the close button',
    },
    /* State */
    isDismissable: {
      control: { type: 'boolean' },
      description:
        'Whether the dialog is dismissable (shows close button, allows Escape key)',
      table: {
        defaultValue: { summary: false },
      },
    },
    onDismiss: {
      action: 'dismiss',
      description: 'Callback fired when the dialog is dismissed',
      control: { type: null },
    },
    closeIcon: {
      control: { type: null },
      description: 'Custom close icon element',
    },
    role: {
      options: ['dialog', 'alertdialog'],
      control: { type: 'radio' },
      description: 'ARIA role for the dialog',
      table: {
        defaultValue: { summary: 'dialog' },
      },
    },
    /* Events */
    onBlur: {
      action: 'blur',
      description: 'Callback fired when the dialog loses focus',
      control: { type: null },
    },
    onFocus: {
      action: 'focus',
      description: 'Callback fired when the dialog receives focus',
      control: { type: null },
    },
  },
};

const Template: StoryFn<
  CubeDialogTriggerProps & { size: CubeDialogProps['size'] }
> = ({ size, styles, ...props }) => {
  return (
    <DialogTrigger {...props}>
      <Button>Click me!</Button>
      {(close) => (
        <Dialog size={size} styles={styles}>
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
  );
};

const TemplateWithInput: StoryFn<
  CubeDialogTriggerProps & { size: CubeDialogProps['size'] }
> = ({ size, styles, ...props }) => {
  return (
    <DialogTrigger {...props}>
      <Button>Click me!</Button>
      {(close) => (
        <Dialog size={size} styles={styles}>
          <Header>
            <Title>Modal title</Title>
            <Text>Header</Text>
          </Header>
          <Content>
            <TextInput autoFocus label="Text input" />
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
  );
};

const WithTriggerStateTemplate: StoryFn<
  CubeDialogTriggerProps & { size: CubeDialogProps['size'] }
> = ({ size, styles, ...props }) => {
  return (
    <DialogTrigger {...props} type="popover">
      {({ isOpen }) => (
        <Button rightIcon={<DirectionIcon to={isOpen ? 'top' : 'bottom'} />}>
          Open modal
        </Button>
      )}
      <Dialog size={size} styles={styles}>
        <Content>
          <Paragraph>Test content</Paragraph>
        </Content>
      </Dialog>
    </DialogTrigger>
  );
};

export const Default = Template.bind({});
Default.play = async ({ canvasElement, viewMode }) => {
  if (viewMode === 'docs') return;

  const { findByRole } = within(canvasElement);

  await userEvent.click(await findByRole('button'));

  await expect(await findByRole('dialog')).toBeInTheDocument();
};

export const WithInput = TemplateWithInput.bind({});
WithInput.play = Default.play;

export const Modal: typeof Template = Template.bind({});
Modal.args = {
  type: 'modal',
};
Modal.play = Default.play;

export const Popover: typeof Template = Template.bind({});
Popover.args = {
  type: 'popover',
};
Popover.play = Default.play;

export const Tray: typeof Template = Template.bind({});
Tray.args = {
  type: 'tray',
};
Tray.play = Default.play;

export const Fullscreen: typeof Template = Template.bind({});
Fullscreen.args = {
  type: 'fullscreen',
};
Fullscreen.play = Default.play;

export const FullscreenTakeover: typeof Template = Template.bind({});
FullscreenTakeover.args = {
  type: 'fullscreenTakeover',
};
FullscreenTakeover.play = Default.play;

export const Panel: typeof Template = Template.bind({});
Panel.args = {
  type: 'panel',
  styles: {
    right: '2x',
    bottom: '2x',
    radius: true,
    width: '320px',
    height: '(100vh - 10x)',
  },
};
Panel.play = Default.play;

export const SizeSmall: typeof Template = Template.bind({});
SizeSmall.args = {
  size: 'small',
};
SizeSmall.play = Default.play;

export const SizeMedium: typeof Template = Template.bind({});
SizeMedium.args = {
  size: 'medium',
};
SizeMedium.play = Default.play;

export const SizeLarge: typeof Template = Template.bind({});
SizeLarge.args = {
  size: 'large',
};
SizeLarge.play = Default.play;

export const CloseBehaviorHideDialog: typeof Template = Template.bind({});
CloseBehaviorHideDialog.args = {
  hideOnClose: true,
};
CloseBehaviorHideDialog.play = async ({ canvasElement, viewMode }) => {
  if (viewMode === 'docs') return;

  const { getByRole, findByRole } = within(canvasElement);

  await userEvent.click(getByRole('button'));
  await waitFor(() => expect(getByRole('dialog')).toBeVisible());
  await expect(await findByRole('dialog')).toBeVisible();

  await userEvent.click(getByRole('button', { name: 'Cancel' }));
};

export const CloseBehaviorHidePopover: typeof Template = Template.bind({});
CloseBehaviorHidePopover.args = {
  type: 'popover',
  hideOnClose: true,
};
CloseBehaviorHidePopover.play = CloseBehaviorHideDialog.play;

export const CloseBehaviorHideTray: typeof Template = Template.bind({});
CloseBehaviorHideTray.args = {
  type: 'tray',
  hideOnClose: true,
};
CloseBehaviorHideTray.play = CloseBehaviorHideDialog.play;

export const CloseBehaviorHideFullscreen: typeof Template = Template.bind({});
CloseBehaviorHideFullscreen.args = {
  type: 'fullscreen',
  hideOnClose: true,
};
CloseBehaviorHideFullscreen.play = CloseBehaviorHideDialog.play;

export const CloseBehaviorHideFullscreenTakeover: typeof Template =
  Template.bind({});
CloseBehaviorHideFullscreenTakeover.args = {
  type: 'fullscreenTakeover',
  hideOnClose: true,
};
CloseBehaviorHideFullscreenTakeover.play = CloseBehaviorHideDialog.play;

export const CloseBehaviorHidePanel: typeof Template = Template.bind({});
CloseBehaviorHidePanel.args = {
  type: 'panel',
  hideOnClose: true,
};
CloseBehaviorHidePanel.play = CloseBehaviorHideDialog.play;

export const CloseOnEsc: typeof Template = Template.bind({});
CloseOnEsc.play = async (context) => {
  if (context.viewMode === 'docs') return;

  const { findByRole } = within(context.canvasElement);

  const trigger = await findByRole('button');

  await userEvent.click(trigger);

  await timeout(500);

  const dialog = await findByRole('dialog');

  await expect(dialog).toBeInTheDocument();
  await expect(dialog.contains(document.activeElement)).toBe(true);

  await userEvent.keyboard('{Escape}');

  await timeout(500);

  await expect(dialog).not.toBeInTheDocument();

  await waitFor(() => expect(document.activeElement).toBe(trigger));
};

export const CloseOnEscCloseBehaviorHide: typeof Template = Template.bind({});
CloseOnEscCloseBehaviorHide.args = {
  hideOnClose: true,
};
CloseOnEscCloseBehaviorHide.play = async (context) => {
  if (context.viewMode === 'docs') return;

  const { findByRole } = within(context.canvasElement);

  const trigger = await findByRole('button');

  await userEvent.click(trigger);

  await timeout(500);

  const dialog = await findByRole('dialog');

  await expect(dialog).toBeInTheDocument();

  await expect(dialog.contains(document.activeElement)).toBe(true);

  await userEvent.keyboard('{Escape}');

  await timeout(500);

  await expect(dialog).toBeInTheDocument();

  await waitFor(() => expect(document.activeElement).toBe(trigger));
};

export const CloseOnOutsideClick: typeof Template = Template.bind({});
CloseOnOutsideClick.play = async (context) => {
  if (context.viewMode === 'docs') return;

  await Default.play?.(context);

  await timeout(500);

  const { findByRole } = within(context.canvasElement);
  const dialog = await findByRole('dialog');

  await userEvent.click(document.body);

  await timeout(500);

  // TODO: fix this
  // expect(dialog).not.toBeInTheDocument();
};

export const DoNotCloseOnClickAtParticularElement: typeof Template = () => {
  const btnRef = useRef<FocusableRefValue<HTMLButtonElement>>(null);
  const [itWorks, setItWorks] = useState(false);

  return (
    <>
      <Space gap="2x">
        <DialogTrigger
          type="popover"
          shouldCloseOnInteractOutside={(e) =>
            btnRef.current?.UNSAFE_getDOMNode() !== e
          }
        >
          <Button size="small">Open modal</Button>

          <Dialog size="small">
            <Header>
              <Title>Modal title</Title>
            </Header>
            <Content>
              <Paragraph>Test content</Paragraph>
              <Paragraph>Test content</Paragraph>
            </Content>
          </Dialog>
        </DialogTrigger>

        <Button ref={btnRef} size="small" onPress={() => setItWorks(true)}>
          {itWorks ? 'It works!' : 'Click me!'}
        </Button>
      </Space>
    </>
  );
};
DoNotCloseOnClickAtParticularElement.play = async (context) => {
  if (context.viewMode === 'docs') return;

  const { findByRole } = within(context.canvasElement);

  const trigger = await findByRole('button', { name: 'Open modal' });
  const button = await findByRole('button', { name: 'Click me!' });

  await userEvent.click(trigger);

  await expect(await findByRole('dialog')).toBeInTheDocument();

  await userEvent.click(button);

  await expect(await findByRole('dialog')).toBeInTheDocument();
  await expect(button).toHaveTextContent('It works!');
};

export const WithTriggerState = WithTriggerStateTemplate.bind({});
WithTriggerState.args = {};
WithTriggerState.play = Default.play;

export const PopoverWithMenuAndSelect: StoryFn<
  CubeDialogTriggerProps & { size: CubeDialogProps['size'] }
> = ({ size, styles, ...props }) => {
  return (
    <DialogTrigger {...props} type="popover">
      <Button>Open Popover</Button>
      <Dialog size={size} styles={styles}>
        <Content>
          <Space flow="row" gap="2x" placeItems="center">
            <MenuTrigger>
              <Button type="outline" size="small">
                Menu
              </Button>
              <Menu>
                <Menu.Item key="copy">Copy</Menu.Item>
                <Menu.Item key="cut">Cut</Menu.Item>
                <Menu.Item key="paste">Paste</Menu.Item>
              </Menu>
            </MenuTrigger>

            <Select size="small" placeholder="Choose option" width="150px">
              <Select.Item key="option1">Option 1</Select.Item>
              <Select.Item key="option2">Option 2</Select.Item>
              <Select.Item key="option3">Option 3</Select.Item>
            </Select>

            <Button type="primary" size="small">
              Action
            </Button>
          </Space>
        </Content>
      </Dialog>
    </DialogTrigger>
  );
};
PopoverWithMenuAndSelect.args = {};
PopoverWithMenuAndSelect.play = async ({ canvasElement, viewMode }) => {
  if (viewMode === 'docs') return;

  const { findByRole, getByRole } = within(canvasElement);

  // Open the popover
  await userEvent.click(await findByRole('button', { name: 'Open Popover' }));

  // Wait for dialog to appear
  const dialog = await findByRole('dialog');
  await expect(dialog).toBeInTheDocument();

  // Test Menu trigger
  const menuButton = getByRole('button', { name: 'Menu' });
  await userEvent.click(menuButton);

  // Check if menu opens
  const menu = await findByRole('menu');
  await expect(menu).toBeInTheDocument();

  // Click somewhere else to close menu, then test Select
  await userEvent.click(dialog);

  // Test Select trigger
  const selectButton = getByRole('button', { name: 'Choose option' });
  await userEvent.click(selectButton);

  // Check if select listbox opens
  const listbox = await findByRole('listbox');
  await expect(listbox).toBeInTheDocument();
};

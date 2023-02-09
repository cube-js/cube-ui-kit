import { within, userEvent, waitFor } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { Story } from '@storybook/react';
import { useRef, useState } from 'react';
import { FocusableRefValue } from '@react-types/shared';

import { CubeDialogProps } from '../Dialog';
import { CubeDialogTriggerProps } from '../DialogTrigger';
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
  Space,
} from '../../../../index';
import { baseProps } from '../../../../stories/lists/baseProps';

export default {
  title: 'Overlays/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
    controls: {
      exclude: baseProps,
    },
  },
};

const Template: Story<
  CubeDialogTriggerProps & { size: CubeDialogProps['size'] }
> = ({ size, ...props }) => {
  return (
    <DialogTrigger {...props}>
      <Button>Click me!</Button>
      {(close) => (
        <Dialog size={size}>
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

export const Default = Template.bind({});
Default.play = async ({ canvasElement, viewMode }) => {
  if (viewMode === 'docs') return;

  const { getByRole, findByRole } = within(canvasElement);
  await userEvent.click(getByRole('button'));

  await expect(await findByRole('dialog')).toBeInTheDocument();
};

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

  const dialog = await findByRole('dialog');

  await expect(dialog).toBeInTheDocument();
  await expect(dialog.contains(document.activeElement)).toBe(true);

  await userEvent.keyboard('{Escape}');

  await waitFor(() => expect(document.activeElement).toBe(trigger));
};

export const CloseOnEscCloseBehaviorHide: typeof Template = Template.bind({});
CloseOnEscCloseBehaviorHide.args = {
  hideOnClose: true,
};
CloseOnEscCloseBehaviorHide.play = CloseOnEsc.play;

export const CloseOnOutsideClick: typeof Template = Template.bind({});
CloseOnOutsideClick.play = async (context) => {
  if (context.viewMode === 'docs') return;

  await Default.play?.(context);

  const { findByRole } = within(context.canvasElement);
  const dialog = await findByRole('dialog');

  await userEvent.click(document.body);

  expect(dialog).not.toBeInTheDocument();
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

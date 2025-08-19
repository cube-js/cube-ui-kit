import { Meta, StoryFn } from '@storybook/react-vite';
import { expect, userEvent, within } from '@storybook/test';
import { action } from 'storybook/actions';

import { baseProps } from '../../../stories/lists/baseProps';
import { Button } from '../../actions';
import { Paragraph } from '../../content/Paragraph';
import { DialogTrigger } from '../Dialog/DialogTrigger';

import { AlertDialog, CubeAlertDialogProps } from './AlertDialog';
import { useAlertDialogAPI } from './AlertDialogApiProvider';
import { DialogProps } from './types';

export default {
  title: 'Overlays/AlertDialog',
  component: AlertDialog,
  args: {
    content: (
      <Paragraph>
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. A animi
        aperiam cupiditate eius est illo inventore quis rem! At cupiditate
        molestias placeat quasi reprehenderit similique voluptatibus voluptatum.
        Alias atque, distinctio.
      </Paragraph>
    ),
  },
  parameters: { controls: { exclude: baseProps } },
} as Meta<typeof AlertDialog>;

const Template: StoryFn<CubeAlertDialogProps> = (args) => {
  return (
    <DialogTrigger
      isDismissable
      placement="top"
      onDismiss={(action) => console.log('onDismiss event', action)}
    >
      <Button>Open Modal</Button>

      {() => <AlertDialog title="Title" {...args} />}
    </DialogTrigger>
  );
};

export const Default = Template.bind({});
Default.args = {};
Default.play = async ({ canvasElement }) => {
  const { findByRole } = within(canvasElement);
  await userEvent.click(await findByRole('button'));
  await expect(await findByRole('alertdialog')).toBeInTheDocument();
};

export const UsingApi: StoryFn<DialogProps> = (args) => {
  const dialogAPI = useAlertDialogAPI();

  return (
    <Button
      {...args}
      onPress={async () =>
        dialogAPI
          .open(args)
          .then(action('DialogClosed'))
          .catch(action('DialogClosedWithReject'))
      }
    >
      Open Modal
    </Button>
  );
};
UsingApi.play = async ({ canvasElement }) => {
  const { findByRole } = within(canvasElement);
  await userEvent.click(await findByRole('button'));

  await expect(await findByRole('alertdialog')).toBeInTheDocument();
};

export const UsingApiWithCancel: StoryFn<DialogProps> = (args) => {
  const dialogAPI = useAlertDialogAPI();

  return (
    <Button
      onPress={() => {
        const cancelDialog = new AbortController();

        const openedDialog = dialogAPI.open(
          {
            ...args,
            actions: {
              confirm: {
                qa: 'CancelToken',
                onPress: () => cancelDialog.abort(),
                children: 'Click to close via cancel token',
              },
            },
          },
          { cancelToken: cancelDialog.signal },
        );

        openedDialog
          .then(action('DialogClosed'))
          .catch(action('DialogClosedWithReject'));
      }}
    >
      Open Modal
    </Button>
  );
};
UsingApiWithCancel.play = async ({ canvasElement }) => {
  const { getByRole, getByTestId, queryByRole, findByRole } =
    within(canvasElement);

  await userEvent.click(getByRole('button'));

  const dialog = await findByRole('alertdialog');

  await expect(dialog).toBeInTheDocument();
  await userEvent.click(getByTestId('CancelToken'));

  await expect(queryByRole('alertdialog')).not.toBeInTheDocument();
};

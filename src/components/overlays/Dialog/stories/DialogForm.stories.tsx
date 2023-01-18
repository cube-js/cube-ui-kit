import {
  userEvent,
  waitForElementToBeRemoved,
  within,
} from '@storybook/testing-library';
import { ComponentMeta, StoryFn } from '@storybook/react';
import { expect } from '@storybook/jest';
import { useState } from 'react';

import { CubeDialogFormProps, DialogForm } from '../DialogForm';
import { Button } from '../../../actions';
import { Paragraph } from '../../../content/Paragraph';
import { Text } from '../../../content/Text';
import { Input } from '../../../forms';
import { DialogTrigger } from '../DialogTrigger';
import { baseProps } from '../../../../stories/lists/baseProps';
import { Form } from '../../../forms/Form';
import { DialogContainer } from '../DialogContainer';

export default {
  title: 'Overlays/DialogForm',
  component: DialogForm,
  parameters: { controls: { exclude: baseProps } },
} as ComponentMeta<typeof DialogForm>;

const TemplateTrigger: StoryFn<CubeDialogFormProps> = (args) => {
  return (
    <DialogTrigger>
      <Button>Open</Button>

      <DialogForm {...args} />
    </DialogTrigger>
  );
};

const TemplateContainer: StoryFn<CubeDialogFormProps> = (args) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onPress={() => setIsOpen(true)}>Open</Button>

      <DialogContainer isOpen={isOpen} onDismiss={() => setIsOpen(false)}>
        <DialogForm {...args} />
      </DialogContainer>
    </>
  );
};

const DIALOG_CHILDREN = (
  <>
    <Paragraph>
      Are you sure you want to permanently delete&nbsp;
      <Text.Strong style={{ whiteSpace: 'pre' }}>deployment</Text.Strong>?
    </Paragraph>
    <Form.Item
      name="name"
      rules={[
        {
          validator(rule, value) {
            return value === 'deployment'
              ? Promise.resolve()
              : Promise.reject('Please enter your deployment name!');
          },
        },
      ]}
    >
      <Input.Text
        placeholder="Enter deployment"
        data-qa="DeleteDeploymentName"
      />
    </Form.Item>
  </>
);

export const AsyncExampleTrigger = TemplateTrigger.bind({});
AsyncExampleTrigger.args = {
  title: 'Confirm delete',
  submitProps: { theme: 'danger', label: 'Delete', qa: 'Delete' },
  onSubmit: () => new Promise((resolve) => setTimeout(resolve, 1_500)),
  children: DIALOG_CHILDREN,
};

export const AsyncExampleContainer = TemplateContainer.bind({});
AsyncExampleContainer.args = {
  title: 'Confirm delete',
  submitProps: { theme: 'danger', label: 'Delete', qa: 'Delete' },
  onSubmit: () => new Promise((resolve) => setTimeout(resolve, 1_500)),
  children: DIALOG_CHILDREN,
};

AsyncExampleTrigger.play = async ({ viewMode, canvasElement }) => {
  if (viewMode === 'docs') return;
  const screen = within(canvasElement);
  await userEvent.click(screen.getByRole('button'));
  const dialog = await screen.findByRole('dialog');
  await expect(dialog).toBeInTheDocument();

  const dialogCanvas = within(dialog);

  await userEvent.type(
    dialogCanvas.getByTestId('DeleteDeploymentName'),
    'deployment',
    { delay: 50 },
  );

  await userEvent.click(dialogCanvas.getByTestId('Delete'));
  await waitForElementToBeRemoved(dialog);
  await expect(dialog).not.toBeInTheDocument();
};

AsyncExampleContainer.play = async ({ viewMode, canvasElement }) => {
  if (viewMode === 'docs') return;
  const screen = within(canvasElement);
  await userEvent.click(screen.getByRole('button'));
  const dialog = await screen.findByRole('dialog');
  await expect(dialog).toBeInTheDocument();

  const dialogCanvas = within(dialog);

  await userEvent.type(
    dialogCanvas.getByTestId('DeleteDeploymentName'),
    'deployment',
    { delay: 50 },
  );

  await userEvent.click(dialogCanvas.getByTestId('Delete'));
  await waitForElementToBeRemoved(dialog);
  await expect(dialog).not.toBeInTheDocument();
};

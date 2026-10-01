import { IconBulb, IconLock } from '@tabler/icons-react';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { Icon } from '../../../icons/Icon';
import { Button } from '../../actions/Button';
import { Dialog } from '../../overlays/Dialog/Dialog';
import { DialogContainer } from '../../overlays/Dialog/DialogContainer';
import { Alert } from '../Alert/Alert';
import { Content } from '../Content';
import { Layout } from '../Layout';
import { Text } from '../Text';
import { Title } from '../Title';

import { CubeResultProps, Result } from './Result';

import type { Meta, StoryFn } from '@storybook/react-vite';

export default {
  title: 'Content/Result',
  component: Result,
  argTypes: {
    /* Content */
    title: {
      control: 'text',
      description: 'Main title text',
    },
    subtitle: {
      control: 'text',
      description: 'Secondary text below the title',
    },
    icon: {
      control: { type: null },
      description: 'Custom icon that replaces the status icon',
    },
    actions: {
      control: { type: null },
      description:
        'Action buttons: a centered row by default, a full-width column in the `stacked` layout',
    },
    children: {
      control: { type: null },
      description: 'Free content between the text and the actions',
    },

    /* Presentation */
    status: {
      control: 'radio',
      options: [
        undefined,
        'info',
        'success',
        'warning',
        'error',
        404,
        403,
        500,
      ],
      description: 'Predefined status with corresponding icon',
      table: {
        defaultValue: { summary: 'info' },
      },
    },
    size: {
      control: 'radio',
      options: ['medium', 'large'],
      description:
        'Visual scale: the icon size and the title and subtitle presets. Does not change the layout',
      table: {
        defaultValue: { summary: 'medium' },
      },
    },
    layout: {
      control: 'radio',
      options: ['default', 'stacked'],
      description:
        'Arrangement of the block. `stacked` fills the container and stacks the actions to the full width, as in a confirmation or result dialog',
      table: {
        defaultValue: { summary: 'default' },
      },
    },
    isCompact: {
      control: 'boolean',
      description: 'Use a compact horizontal layout',
      table: {
        defaultValue: { summary: false },
      },
    },
  },
} as Meta<typeof Result>;

const Template: StoryFn<CubeResultProps> = ({ children, ...props }) => {
  return <Result {...props}>{children}</Result>;
};

export const Success = Template.bind({});
Success.args = {
  status: 'success',
  title: 'Successfully Purchased Cloud Server ECS!',
  subtitle:
    'Order number: 2017182818828182881 Cloud server configuration takes 1-5 minutes, please wait.',
  actions: (
    <>
      <Button type="primary">Go Console</Button>
      <Button type="outline-2">Buy Again</Button>
    </>
  ),
};

export const Info = Template.bind({});
Info.args = {
  status: 'info',
  title: 'Your operation has been executed',
  actions: <Button type="primary">Go Console</Button>,
};

export const Warning = Template.bind({});
Warning.args = {
  status: 'warning',
  title: 'There are some problems with your operation',
  actions: <Button type="primary">Go Console</Button>,
};

export const Error = Template.bind({});
Error.args = {
  status: 'error',
  title: 'Submission Failed',
  subtitle:
    'Please check and modify the following information before resubmitting.',
  actions: (
    <>
      <Button type="primary">Go Console</Button>
      <Button type="outline-2">Buy Again</Button>
    </>
  ),
};

export const CustomIcon = Template.bind({});
CustomIcon.args = {
  title: 'Access is denied!',
  subtitle: 'Request access from the administrator.',
  icon: (
    <Icon color="#warning">
      <IconLock />
    </Icon>
  ),
  actions: <Button>Request</Button>,
};

export const CustomTitle = Template.bind({});
CustomTitle.args = {
  title: (
    <Title level={3} preset="h2">
      Advice
    </Title>
  ),
  subtitle: (
    <Text.Highlight>
      Complete your profile to increase search relevancy.
    </Text.Highlight>
  ),
  icon: <IconBulb />,
  actions: <Button type="primary">Complete Now</Button>,
};

export const Compact = Template.bind({});
Compact.args = {
  isCompact: true,
  status: 'success',
  title: 'Successfully Purchased Cloud Server ECS!',
  subtitle:
    'Order number: 2017182818828182881 Cloud server configuration takes 1-5 minutes, please wait.',
  actions: (
    <>
      <Button type="primary">Go Console</Button>
      <Button type="outline-2">Buy Again</Button>
    </>
  ),
};

export const Large = Template.bind({});
Large.args = {
  size: 'large',
  status: 'success',
  title: 'Payment complete',
  subtitle: 'Charged $1,234.00 to Visa **** 4242',
  actions: (
    <>
      <Button type="primary" size="large">
        Done
      </Button>
      <Button type="outline-2" size="large">
        View invoice
      </Button>
    </>
  ),
};
Large.parameters = {
  docs: {
    description: {
      story:
        'The `large` size scales the icon, the title and the subtitle. The layout stays the same: the actions still sit in a centered row. Pass `size="large"` to the buttons to match.',
    },
  },
};

export const Stacked: StoryFn<CubeResultProps> = () => (
  <Layout.Grid columns="repeat(auto-fill, minmax(320px, 1fr))" gap="4x">
    <Result
      size="large"
      layout="stacked"
      status="success"
      title="Payment complete"
      subtitle="Charged $1,234.00 to Visa **** 4242"
      actions={
        <Button type="primary" size="large">
          Done
        </Button>
      }
    />
    <Result
      size="large"
      layout="stacked"
      status="warning"
      title="Some invoices were paid"
      subtitle="$800.00 paid, $434.00 still due. Your card was declined."
      actions={
        <>
          <Button type="primary" size="large">
            Update card
          </Button>
          <Button type="outline-2" size="large">
            Close
          </Button>
        </>
      }
    />
    <Result
      size="large"
      layout="stacked"
      status="error"
      title="Payment failed"
      subtitle="Your card was declined. Nothing was charged."
      actions={
        <>
          <Button type="primary" size="large">
            Update card
          </Button>
          <Button type="outline-2" size="large">
            Close
          </Button>
        </>
      }
    />
    <Result
      size="large"
      layout="stacked"
      title="Payment status unknown"
      subtitle="We couldn't confirm whether the payment went through. Check your invoices in a few minutes before paying again."
      actions={
        <Button type="primary" size="large">
          Close
        </Button>
      }
    >
      <Alert>Refreshing the invoices in the background.</Alert>
    </Result>
  </Layout.Grid>
);
Stacked.parameters = {
  docs: {
    description: {
      story:
        'The `stacked` layout fills the container and stacks the actions to the full width; with `size="large"` it is the vertical card of a confirmation or result dialog. Free `children` stretch to the full width too.',
    },
  },
};

export const InDialog: StoryFn<CubeResultProps> = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onPress={() => setIsOpen(true)}>Open</Button>
      <DialogContainer isOpen={isOpen} onDismiss={() => setIsOpen(false)}>
        <Dialog size="S">
          <Content>
            <Result
              size="large"
              layout="stacked"
              status="success"
              title="Payment complete"
              subtitle="Charged $1,234.00 to Visa **** 4242"
              actions={
                <Button
                  type="primary"
                  size="large"
                  onPress={() => setIsOpen(false)}
                >
                  Done
                </Button>
              }
            />
          </Content>
        </Dialog>
      </DialogContainer>
    </>
  );
};
InDialog.play = async ({ canvasElement, viewMode }) => {
  if (viewMode === 'docs') return;

  const canvas = within(canvasElement);

  await userEvent.click(await canvas.findByRole('button', { name: 'Open' }));

  await expect(await canvas.findByRole('dialog')).toBeInTheDocument();
};
InDialog.parameters = {
  docs: {
    description: {
      story:
        'Inside a `Dialog` the stacked large Result is the whole body: no `Header` and no `Footer`. Its title takes the dialog `title` slot, so the dialog is labelled by it. Keep the `Header` out, otherwise both titles get the same id.',
    },
  },
};

export const WidthLimit: StoryFn<CubeResultProps> = (args) => (
  <Result {...args} />
);
WidthLimit.args = {
  status: 'info',
  title: 'Even with a very long heading the layout stays readable',
  subtitle:
    'The Result component caps its width at 80ch so multi-line copy wraps into a comfortable reading column instead of stretching across the full width of a wide container.',
};
WidthLimit.parameters = {
  docs: {
    description: {
      story:
        'The default `width: max 80ch` on `Result` constrains long titles and subtitles to a comfortable reading width even inside a much wider parent.',
    },
  },
};

export const CustomWidth = Template.bind({});
CustomWidth.args = {
  status: 'info',
  title: 'Override the default width',
  subtitle:
    'Pass a `width` prop (or `styles={{ width: ... }}`) to override the built-in 80ch cap.',
  width: 'max 40ch',
};

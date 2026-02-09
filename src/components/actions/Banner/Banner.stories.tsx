import { IconBell } from '@tabler/icons-react';

import { Flex } from '../../layout/Flex';
import { Space } from '../../layout/Space';

import { Banner, BannerProps } from './Banner';

import type { Meta, StoryFn } from '@storybook/react';

const meta = {
  title: 'Actions/Banner',
  component: Banner,
  subcomponents: { 'Banner.Action': Banner.Action, 'Banner.Link': Banner.Link },
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Banner>;

export default meta;

const Template: StoryFn<BannerProps> = (args) => <Banner {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: 'New features are available for your deployment.',
  theme: 'note',
};

/**
 * Shows all four theme variants with actions and dismissible options.
 */
export const Themes: StoryFn<BannerProps> = () => {
  return (
    <Space direction="vertical" width="100%">
      <Banner
        theme="danger"
        actions={<Banner.Action>Update Payment</Banner.Action>}
      >
        Critical: Payment method expired. Update to avoid service interruption.
      </Banner>
      <Banner
        theme="warning"
        actions={<Banner.Action>View Usage</Banner.Action>}
      >
        Warning: API usage at 85% of monthly limit.
      </Banner>
      <Banner theme="note" actions={<Banner.Action>Learn More</Banner.Action>}>
        Tip: Enable auto-scaling to handle traffic spikes automatically.
      </Banner>
      <Banner isDismissible theme="success">
        Deployment v2.4.1 is now live with improved query performance.
      </Banner>
    </Space>
  );
};

/**
 * Demonstrates Banner.Link for inline links within content and multiple Banner.Action buttons.
 */
export const WithLinks: StoryFn<BannerProps> = () => {
  return (
    <Space direction="vertical" gap="1x" width="100%">
      <Banner
        theme="warning"
        actions={<Banner.Action>Upgrade tier</Banner.Action>}
      >
        The selected time range exceeds{' '}
        <Banner.Link to="!https://example.com/docs">
          the retention period
        </Banner.Link>
        . To extend this period, please upgrade or contact us.
      </Banner>
      <Banner
        theme="danger"
        actions={
          <>
            <Banner.Action to="/billing">Go to Billing</Banner.Action>
            <Banner.Action>Contact us</Banner.Action>
          </>
        }
      >
        <Banner.Link to="!https://example.com/limits">Daily limit</Banner.Link>{' '}
        of 10,000 queries is exceeded. Please upgrade your plan.
      </Banner>
    </Space>
  );
};

/**
 * Use shape="sharp" when stacking multiple banners to remove gaps between them.
 */
export const Stacked: StoryFn<BannerProps> = () => {
  return (
    <Flex flow="column" width="100%">
      <Banner
        theme="danger"
        shape="sharp"
        actions={<Banner.Action>Contact Support</Banner.Action>}
      >
        Critical: Your account has been suspended.
      </Banner>
      <Banner
        theme="warning"
        shape="sharp"
        actions={<Banner.Action>Upgrade</Banner.Action>}
      >
        Warning: You have exceeded 80% of your query limit.
      </Banner>
      <Banner isDismissible theme="note" shape="sharp">
        New deployment features are available.
      </Banner>
      <Banner isDismissible theme="success" shape="sharp">
        All systems operational.
      </Banner>
    </Flex>
  );
};

export const CustomIcon = Template.bind({});
CustomIcon.args = {
  children: 'You have new notifications.',
  theme: 'note',
  icon: <IconBell />,
  isDismissible: true,
};

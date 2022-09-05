import { TeamOutlined, PlusOutlined } from '@ant-design/icons';

import { Tabs } from './Tabs';

export default {
  title: 'Navigation/Tabs',
  component: Tabs,
  argTypes: {},
};

const Template = () => {
  return (
    <Tabs>
      <Tabs.Item title="Tab 1" icon={<TeamOutlined />}>
        One Tab Content
      </Tabs.Item>
      <Tabs.Item title="Tab 2">Two Tab Content</Tabs.Item>
      <Tabs.Item textValue="Add Tab" icon={<PlusOutlined />} />
    </Tabs>
  );
};

export const Default = Template.bind({});
Default.args = {};

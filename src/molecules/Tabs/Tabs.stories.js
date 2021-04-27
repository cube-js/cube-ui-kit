import React, { useState } from 'react';

import UIKitTabs from './Tabs';

// fix component name
const Tabs = (args) => <UIKitTabs {...args} />;

Tabs.TabPane = UIKitTabs.TabPane;

export default {
  title: 'UIKit/Molecules/Tabs',
  component: Tabs,
  argTypes: {},
};

const Template = () => {
  const [arr, setArr] = useState([1, 2, 3, 4, 5, 6, 7]);
  const [activeKey, setActiveKey] = useState(2);

  function onClose(id) {
    setArr((arr) => arr.filter((n) => n !== id));
  }

  function onClick(id) {
    setActiveKey(id);
  }

  return (
    <Tabs activeKey={activeKey} onTabClose={onClose} onTabClick={onClick}>
      {arr.map((n) => (
        <Tabs.TabPane tab={`Long Tab ${n}`} id={n} key={n} dirty={n === 3}>
          Content of tab {n}
        </Tabs.TabPane>
      ))}
    </Tabs>
  );
};

export const Basic = Template.bind({});
Basic.args = {};

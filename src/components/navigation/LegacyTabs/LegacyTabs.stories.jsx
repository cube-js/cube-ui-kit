import { useState } from 'react';
import { LegacyTabs } from './LegacyTabs';

export default {
  title: 'UIKit/Navigation/Tabs',
  component: LegacyTabs,
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
    <LegacyTabs activeKey={activeKey} onTabClose={onClose} onTabClick={onClick}>
      {arr.map((n) => (
        <LegacyTabs.TabPane title={`Long Tab ${n}`} id={n} key={n}>
          Content of tab {n}
        </LegacyTabs.TabPane>
      ))}
    </LegacyTabs>
  );
};

export const Basic = Template.bind({});
Basic.args = {};

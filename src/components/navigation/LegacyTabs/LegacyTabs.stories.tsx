import { useState } from 'react';

import { LegacyTabs } from './LegacyTabs';

export default {
  title: 'Navigation/LegacyTabs',
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
        <LegacyTabs.TabPane key={n} title={`Long Tab ${n}`} id={n}>
          Content of tab {n}
        </LegacyTabs.TabPane>
      ))}
    </LegacyTabs>
  );
};

export const Basic = Template.bind({});
Basic.args = {};

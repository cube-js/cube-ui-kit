import { useState } from 'react';
import { Tabs } from './Tabs';

export default {
  title: 'UIKit/Navigation/Tabs',
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
        <Tabs.TabPane title={`Long Tab ${n}`} id={n} key={n}>
          Content of tab {n}
        </Tabs.TabPane>
      ))}
    </Tabs>
  );
};

export const Basic = Template.bind({});
Basic.args = {};

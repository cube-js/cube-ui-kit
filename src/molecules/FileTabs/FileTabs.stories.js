import { useState } from 'react';
import { FileTabs } from './FileTabs';

export default {
  title: 'UIKit/Molecules/FileTabs',
  component: FileTabs,
  argTypes: {},
};

const Template = () => {
  const [arr, setArr] = useState([1, 2, 3, 4, 5, 6, 7]);
  const [activeKey, setActiveKey] = useState(2);

  function onClose(id) {
    setArr((arr) => arr.filter((n) => n !== id));
  }

  function onPress(id) {
    setActiveKey(id);
  }

  return (
    <FileTabs activeKey={activeKey} onTabClose={onClose} onTabClick={onPress}>
      {arr.map((n) => (
        <FileTabs.TabPane
          title={`Long Tab ${n}`}
          id={n}
          key={n}
          isDirty={n === 3}
        >
          Content of tab {n}
        </FileTabs.TabPane>
      ))}
    </FileTabs>
  );
};

export const Basic = Template.bind({});
Basic.args = {};

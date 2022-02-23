import { ActionButton, Item, Menu, MenuTrigger } from '.';

export default {
  title: 'Test',
  component: Menu,
  argTypes: {
    type: {
      defaultValue: 'note',
      control: {
        type: 'radio',
        options: ['danger', 'success', 'note'],
      },
    },
  },
};

const Template = () => (
  <MenuTrigger>
    <ActionButton>Show Menu</ActionButton>
    <Menu
      onAction={(id) => {
        console.log(id);
      }}
    >
      <Item id="item-1">Item 1</Item>
      <Item id="item-2">Item 2</Item>
      <Item id="item-3">Item 3</Item>
    </Menu>
  </MenuTrigger>
);

export const Test = Template.bind({});
Test.args = {};

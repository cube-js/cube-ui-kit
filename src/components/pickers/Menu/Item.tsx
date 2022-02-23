import { FC, useContext } from 'react';

import { styled } from '../../../styled';

import { MenuContext } from './Menu';

const Container = styled({
  name: 'MenuItemContainer',
  tag: 'li',
  styles: {
    cursor: 'pointer',
    display: 'flex',
    height: '32px',
    padding: '0 12px',
    placeItems: 'center',
    whiteSpace: 'nowrap',
    userSelect: 'none',

    '&:hover': {
      backgroundColor: '#F1F1F1',
    },
  },
});

export interface ItemProps {
  id: string;
}

export const Item: FC<ItemProps> = (props) => {
  const { children, id } = props;

  const menuContext = useContext(MenuContext);

  const handleClick = () => {
    menuContext?.action(id);
  };

  return <Container onClick={handleClick}>{children}</Container>;
};

import { styled } from '../../../styled';

export const StyledMenu = styled({
  tag: 'ul',
  name: 'Menu',
  styles: {
    background: '#white',
    margin: '0',
    padding: '0',
    border: '#dark.04',
    radius: '1r',
    boxShadow: '0px 5px 15px rgba(var(--dark-color-rgb), 0.05)',
  },
});

export const StyledDivider = styled({
  tag: 'li',
  styles: {
    margin: '0',
    listStyle: 'none',
    background: '#dark.04',
    height: '1px',
  },
});

export const StyledMenuItem = styled({
  tag: 'li',
  styles: {
    margin: '0',
    listStyle: 'none',
    justifyContent: 'center',
    padding: '10px',
    fill: {
      '': '',
      disabled: '',
      selected: '',
      selectable: '',
      hovered: '',
    },
  },
});

export const StyledMenuSectionHeading = styled({
  tag: 'span',
});

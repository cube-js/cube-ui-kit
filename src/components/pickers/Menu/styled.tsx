import { styled } from '../../../styled';
import { Space } from '../../layout/Space';

export const StyledMenu = styled({
  tag: 'ul',
  name: 'Menu',
  styles: {
    display: 'flex',
    flow: 'column',
    fill: '#white',
    margin: '0',
    padding: '0',
    border: {
      '': '#dark.05',
      section: '',
    },
    radius: {
      '': '1r',
      header: '1x 1x 1r 1r',
    },
    boxShadow: {
      '': '',
      popover: '0px 5px 15px rgba(var(--dark-color-rgb), 0.05)',
    },
  },
});

export const StyledDivider = styled({
  tag: 'li',
  styles: {
    display: 'flex',
    flow: 'column',
    margin: '0',
    listStyle: 'none',
    background: '#dark.05',
    height: '1px',
  },
});

export const StyledMenuItem = styled({
  tag: 'li',
  styles: {
    display: 'flex',
    flow: 'column',
    margin: '0',
    padding: '0',
    listStyle: 'none',
    fill: {
      '': '#white',
      disabled: '#white',
      selected: '#light-02',
      selectable: '#light-02',
      hovered: '#light-02',
    },
  },
});

export const StyledMenuSectionHeading = styled(Space, {
  tag: 'header',
  styles: {
    color: '#dark-03',
    fontSize: '1.75x',
    textTransform: 'uppercase',
    padding: '1x 1.5x',
    placeContent: 'space-between',
    align: 'start',
  },
});

export const StyledMenuHeader = styled(Space, {
  tag: 'li',
  styles: {
    fill: '#light-02',
    color: '#dark-02',
    padding: '1.5x',
    borderBottom: '#dark.04',
    placeContent: 'space-between',
    align: 'start',
    fontWeight: '500',
    radius: '1x 1x 0 0',
  },
});

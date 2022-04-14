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
    padding: {
      '': '0.5x',
      section: '0',
    },
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
    margin: '0 -0.5x',
    listStyle: 'none',
    background: '#dark.05',
    height: '1px',
  },
});

export const StyledMenuHeader = styled(Space, {
  tag: 'li',
  styles: {
    fill: '#light-02',
    color: '#dark-02',
    padding: '0.75x 2x',
    margin: '-0.5x -0.5x (0.5x - 1px) -0.5x',
    borderBottom: '#dark.04',
    placeContent: 'space-between',
    align: 'start',
    fontWeight: '500',
    radius: '1x 1x 0 0',
  },
});

export const StyledMenuItem = styled({
  tag: 'li',
  styles: {
    display: 'flex',
    flow: 'column',
    margin: '1px 0',
    padding: '0',
    listStyle: 'none',
    fill: '#white',
    color: {
      '': 'inherit',
      disabled: '#dark-04',
    },
  },
});

export const StyledMenuSectionHeading = styled(Space, {
  tag: 'header',
  styles: {
    color: '#dark-04',
    fontSize: '1.75x',
    textTransform: 'uppercase',
    padding: '(0.75x - 1px) (1.5x - 1px)',
    placeContent: 'space-between',
    align: 'start',
  },
});

import { styled } from '../../../styled';
import { Space } from '../../layout/Space';

export const StyledMenu = styled({
  tag: 'ul',
  name: 'Menu',
  styles: {
    display: 'flex',
    flow: 'column',
    gap: {
      '': '1px',
      sections: '',
    },
    fill: '#white',
    margin: '0',
    padding: {
      '': '0.5x',
      section: '0',
    },
    border: {
      '': '#dark-05',
      section: '',
    },
    radius: {
      '': '1r',
    },
    boxShadow: {
      '': '',
      popover: '0px 5px 15px #dark.05',
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
    fill: '#dark.05',
    height: '1px',
  },
});

export const StyledMenuHeader = styled(Space, {
  tag: 'li',
  styles: {
    fill: '#light',
    color: '#dark-02',
    preset: 'h5s',
    padding: '0.75x 2x',
    margin: '-0.5x -0.5x (0.5x - 1bw) -0.5x',
    border: '#dark-05 bottom',
    placeContent: 'space-between',
    align: 'start',
    radius: '1r 1r 0 0',
  },
});

export const StyledMenuSection = styled({
  tag: 'li',
  styles: {
    display: 'flex',
    flow: 'column',
    gap: '1px',
    margin: '0',
    padding: {
      '': '0.5x 0',
      ':first-of-type': '0 0 0.5x 0',
      ':last-of-type': '0.5x 0 0 0',
    },
    listStyle: 'none',
    fill: '#white',
  },
});

export const StyledMenuItem = styled({
  tag: 'li',
  styles: {
    display: 'flex',
    flow: 'column',
    gap: '1px',
    margin: '0',
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
    color: '#dark-03',
    preset: 'c1',
    padding: '(0.75x - 1bw) (1.5x - 1bw)',
    placeContent: 'space-between',
    align: 'start',
  },
});

import { tasty } from '../../../tasty';
import { Space } from '../../layout/Space';

export const StyledMenu = tasty({
  as: 'ul',
  qa: 'Menu',
  styles: {
    display: 'flex',
    flow: 'column',
    gap: {
      '': '1bw',
      sections: '',
    },
    fill: '#white',
    margin: '0',
    padding: {
      '': '0.5x',
      section: '0.5x', // section menu
      sections: '0', // has sections inside
    },
    overflow: {
      '': 'auto',
      section: '',
    },
    border: {
      '': '#dark-05',
      section: '',
    },
    radius: '@modal-radius',
    boxShadow: {
      '': '',
      popover: '0px 5px 15px #dark.05',
    },
    styledScrollbar: true,
  },
});

export const StyledDivider = tasty({
  as: 'li',
  styles: {
    display: 'flex',
    flow: 'column',
    margin: '0 -0.5x',
    listStyle: 'none',
    fill: '#dark.05',
    height: '1bw',
  },
});

export const StyledMenuHeader = tasty(Space, {
  as: 'li',
  styles: {
    fill: '#light',
    color: '#dark-02',
    preset: 't2m',
    padding: '0.75x 2x',
    margin: '-0.5x -0.5x (0.5x - 1bw) -0.5x',
    border: '#dark-05 bottom',
    placeContent: 'space-between',
    align: 'start',
    radius: '1r 1r 0 0',
    whiteSpace: 'nowrap',
  },
});

export const StyledMenuSection = tasty({
  as: 'li',
  styles: {
    display: 'flex',
    flow: 'column',
    margin: '0',
    padding: '0',
    listStyle: 'none',
    fill: '#white',
  },
});

export const StyledMenuItem = tasty({
  as: 'li',
  styles: {
    display: 'flex',
    flow: 'column',
    gap: '1bw',
    margin: '0',
    padding: '0',
    listStyle: 'none',
    fill: '#white',
    preset: 't3m',
    color: {
      '': 'inherit',
      disabled: '#dark-04',
    },
    whiteSpace: 'nowrap',
  },
});

export const StyledMenuSectionHeading = tasty(Space, {
  as: 'header',
  styles: {
    color: '#dark-03',
    fill: '#light',
    preset: 'c2',
    padding: '(1x - 1bw) 2x',
    placeContent: 'space-between',
    align: 'start',
  },
});

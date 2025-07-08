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
      sections: false,
    },
    fill: '#white',
    margin: 0,
    padding: {
      '': '0.5x',
      section: 0, // section menu
    },
    overflow: {
      '': 'auto',
      section: '',
    },
    border: {
      '': '#border',
      section: false,
    },
    radius: '(1cr + 1bw)',
    boxShadow: {
      '': '',
      popover: '0px 5px 15px #dark.05',
    },
    scrollbar: 'styled',
  },
});

export const StyledDivider = tasty({
  qa: 'Divider',
  as: 'li',
  styles: {
    display: 'flex',
    flow: 'column',
    margin: '.5x',
    listStyle: 'none',
    fill: '#border',
    height: '1bw',
    flexShrink: 0,
  },
});

export const StyledHeader = tasty(Space, {
  qa: 'Header',
  as: 'li',
  styles: {
    color: '#dark-02',
    preset: 't2m',
    padding: '0.75x 1.5x',
    margin: '-0.5x -0.5x (0.5x - 1bw) -0.5x',
    border: '#dark-05 bottom',
    placeContent: 'space-between',
    align: 'start',
    radius: '1r 1r 0 0',
    whiteSpace: 'nowrap',
  },
});

export const StyledSection = tasty({
  qa: 'Section',
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

export const StyledItem = tasty({
  qa: 'Item',
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

export const StyledSectionHeading = tasty(Space, {
  as: 'SectionHeading',
  styles: {
    color: '#dark-04',
    preset: 'c2',
    padding: '.5x 1.5x',
    height: '3x',
    placeContent: 'center space-between',
    align: 'start',
  },
});

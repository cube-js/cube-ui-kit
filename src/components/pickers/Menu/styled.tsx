import { tasty } from '../../../tasty';
import { DEFAULT_BUTTON_STYLES, DEFAULT_NEUTRAL_STYLES } from '../../actions';
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
    // Base button-like styles merged from Action/Button defaults
    ...DEFAULT_BUTTON_STYLES,
    ...DEFAULT_NEUTRAL_STYLES,

    // Override specifics for menu context
    display: 'flex',
    flow: 'row',
    justifyContent: 'start',
    listStyle: 'none',
    height: 'min 4x',
    border: '#clear',
    fill: {
      '': '#clear',
      focused: '#dark.03',
      selected: '#dark.06',
      'selected & focused': '#dark.09',
      pressed: '#dark.06',
      disabled: '#clear',
    },
    color: {
      '': '#dark-02',
      'selected | pressed': '#dark',
      disabled: '#dark-04',
    },
    cursor: {
      '': 'pointer',
      disabled: 'default',
    },
    shadow: '#clear',
    padding: {
      '': '0 (1x - 1bw)',
      'selectionIcon & selectable & !selected':
        '0 (1x - 1bw) 0 (1x - 1bw + 3x)',
    },
    gap: '.75x',
    outline: false,

    // Sub-elements reused from MenuButton styles
    ButtonIcon: {
      display: 'grid',
      fontSize: '@icon-size',
      width: '@icon-size',
      height: '@icon-size',
      placeSelf: 'center',
      placeItems: 'center',
    },

    Postfix: {
      color: {
        '': '#dark-03',
        pressed: '#dark-02',
        disabled: '#dark-04',
      },
    },

    Description: {
      preset: 't4',
      color: '#dark-03',
    },
  },
});

export const StyledSectionHeading = tasty(Space, {
  qa: 'SectionHeading',
  as: 'div',
  styles: {
    color: '#dark-04',
    preset: 'c2',
    padding: '.5x 1x',
    height: '3x',
    placeContent: 'center space-between',
    align: 'start',
  },
});

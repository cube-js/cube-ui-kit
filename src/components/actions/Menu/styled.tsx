import { DEFAULT_BUTTON_STYLES, DEFAULT_NEUTRAL_STYLES } from '..';
import { tasty } from '../../../tasty';
import { Space } from '../../layout/Space';

export const StyledMenuWrapper = tasty({
  qa: 'Menu',
  styles: {
    display: 'grid',
    gridRows: 'max-content 1sf max-content',
    fill: '#white',
    margin: 0,
    padding: 0,
    border: true,
    radius: '(1cr + 1bw)',
    shadow: {
      '': '',
      'popover | tray': '0px 5px 15px #dark.05',
    },
    height: {
      '': 'initial',
      popover: 'initial max-content (50vh - 4x)',
      tray: 'initial max-content (100vh - 4x)',
    },
    boxSizing: 'border-box',
  },
});

export const StyledMenu = tasty({
  as: 'ul',
  qa: 'MenuList',
  styles: {
    display: 'flex',
    flow: 'column',
    gap: {
      '': '1bw',
      sections: false,
    },
    boxSizing: 'border-box',
    margin: 0,
    padding: {
      '': '0.5x',
      section: 0, // section menu
    },
    overflow: {
      '': 'auto',
      section: '',
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
  as: 'div',
  role: 'heading',
  'aria-level': 3,
  styles: {
    color: '#dark-02',
    preset: 't3',
    placeContent: 'space-between',
    placeItems: 'center',
    whiteSpace: 'nowrap',
    padding: '.5x 1.5x',
    height: {
      '': 'min 4x',
      '[data-size="medium"]': 'min 5x',
    },
    boxSizing: 'border-box',
    border: 'bottom',
  },
});

export const StyledFooter = tasty(Space, {
  qa: 'Footer',
  as: 'div',
  role: 'footer',
  styles: {
    color: '#dark-02',
    preset: 't3',
    placeContent: 'space-between',
    placeItems: 'center',
    whiteSpace: 'nowrap',
    padding: '.5x 1.5x',
    height: {
      '': 'min 4x',
      '[data-size="medium"]': 'min 5x',
    },
    boxSizing: 'border-box',
    border: 'top',
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
    justifyContent: 'stretch',
    listStyle: 'none',
    flexShrink: 0,
    height: {
      '': 'min 4x',
      '[data-size="medium"]': 'min 5x',
    },
    border: false,
    boxSizing: 'border-box',
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
      '': 'default',
      disabled: 'not-allowed',
    },
    shadow: '#clear',
    padding: {
      '': '.5x 1x',
      'selectionIcon & selectable & !selected': '.5x 1x .5x (1x + 3x)',
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

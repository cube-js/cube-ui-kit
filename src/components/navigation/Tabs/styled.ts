import { Styles, tasty } from '../../../tasty';

export const StyledTabsContainer = tasty({});

export const StyledTabPanes = tasty({
  styles: {
    display: 'flex',
    flow: 'row',
    gap: '3x',
  },
});

export const StyledTabItem = tasty({
  styles: {
    preset: 'h5s',
    display: 'flex',
    placeItems: 'center stretch',
    placeContent: 'center',
    flow: 'row',
    gap: '1x',
    fill: '#clear',
    color: {
      '': '#dark',
      selected: '#purple-text',
      hovered: '#purple-text',
    },
    outline: {
      '': '#purple-03.0',
      focused: '#purple-03',
    },
    border: {
      '': 0,
      selected: 'bottom 3bw #purple-text',
    },
    cursor: {
      '': 'pointer',
      disabled: 'default',
    },
    padding: {
      '': '1.5x 0',
    },
    radius: {
      '': '1r',
      selected: '1r 1r 0 0',
    },
  },
});

export const StyledTabBody = tasty({});

export const ACTION_BUTTON: Styles = {
  border: {
    '': '#clear',
    pressed: '#clear',
  },
  fill: {
    '': '#clear',
    hovered: '#clear',
    'pressed | selected': '#clear',
    disabled: '#clear',
  },
  color: {
    '': '#dark-02',
    hovered: '#dark-02',
    'pressed | selected': '#purple-text',
    disabled: '#dark-04',
  },
  padding: {
    '': '1.5x 0',
  },
  cursor: {
    '': 'pointer',
    disabled: 'default',
  },
  shadow: '#clear',
  display: 'flex',
  flow: 'row',
  justifyContent: 'start',
};

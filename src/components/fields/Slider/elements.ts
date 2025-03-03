import { tasty } from '../../../tasty';

export const SliderThumbElement = tasty({
  styles: {
    top: '@slider-thumb-offset-top',
    left: '@slider-thumb-offset-left',
    width: '2x',
    height: '2x',
    fill: {
      '': '#purple',
      hovered: '#purple-text',
      dragged: '#purple',
      disabled: '#dark-04',
    },
    cursor: 'pointer',
    boxShadow: '@focus-shadow, @dragged-shadow, @drop-shadow',
    radius: '50%',
    transition: 'theme',
    zIndex: {
      '': 0,
      'collapsed & !stuck': 1,
    },

    '@drop-shadow': '0px 2px 4px #dark.2',
    '@focus-shadow': {
      '': '0 0 0 0 #purple-03.80',
      focused: '0 0 0 3px #purple-03.80',
    },
    '@dragged-shadow': {
      '': 'inset 0 0 0 0 #purple-text',
      dragged: 'inset 0 0 0 2px #purple-text',
    },
  },
});

export const SliderTrackContainerElement = tasty({
  styles: {
    top: {
      '': '0',
      horizontal: '0.875x',
    },
    left: {
      '': '0.875x',
      horizontal: '0',
    },
    position: 'absolute',
    fill: '#dark-05',
    height: {
      '': 'initial 10x 100%',
      horizontal: '2px',
    },
    width: {
      '': '2px',
      horizontal: '100%',
    },
    radius: true,

    '&::before': {
      content: '""',
      display: {
        '': 'none',
        range: 'block',
      },
      position: 'absolute',
      top: 0,
      bottom: 0,
      fill: '#purple',
      left: '@slider-range-start',
      width: '(@slider-range-end - @slider-range-start)',
    },
  },
});

export const SliderGradationElement = tasty({
  styles: {
    position: 'absolute',
    top: '2x',
    left: 0,
    right: 0,

    display: 'flex',
    placeContent: 'space-between',
  },
});

export const SliderGradeElement = tasty({
  styles: {
    display: 'grid',
    width: 'max 0',
    placeContent: 'center',
    preset: 'c2',
    color: '#dark-03',
  },
});

export const SliderControlsElement = tasty({
  styles: {
    position: 'relative',
    height: {
      '': 'initial 8x 100%',
      horizontal: '2x',
    },
    width: {
      '': '2x',
      horizontal: '100% - 2x',
    },

    '@slider-thumb-offset-top': {
      '': '0',
      horizontal: '1x',
    },
    '@slider-thumb-offset-left': {
      '': '1x',
      horizontal: '0',
    },
  },
});

export const SliderElement = tasty({
  qa: 'RangeSlider',
  as: 'section',
  styles: {
    display: 'inline-flex',
    verticalAlign: {
      '': 'middle',
      'side-label & !horizontal': 'top',
    },
    position: 'relative',
    height: {
      '': 'initial 10x 100%',
      horizontal: '2x',
    },
    width: {
      '': '2x',
      horizontal: '100%',
    },

    alignItems: 'center',
    flexDirection: {
      '': 'column',
      inputs: 'row',
    },
  },
});

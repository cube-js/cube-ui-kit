import { tasty } from '../../../tasty';

export const SliderThumbElement = tasty({
  qa: 'SliderThumb',
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
    outline: {
      '': '#purple-text.0',
      focused: '1bw #purple-text',
    },
    outlineOffset: 1,
    radius: '50%',
    transition: 'theme',
    zIndex: {
      '': 0,
      'collapsed & !stuck': 1,
    },
  },
});

export const SliderTrackContainerElement = tasty({
  qa: 'SliderTrackContainer',
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
      display: 'block',
      position: 'absolute',
      inset: {
        '': 'auto 0 0 0',
        horizontal: '0 auto 0 0',
        range: 'auto 0 @slider-range-start 0',
        'range & horizontal': '0 auto 0 @slider-range-start',
      },
      fill: '#purple',
      width: {
        '': 'auto',
        horizontal: '@slider-value',
        range: 'auto',
        'range & horizontal': '(@slider-range-end - @slider-range-start)',
      },
      height: {
        '': '@slider-value',
        horizontal: 'auto',
        range: '(@slider-range-end - @slider-range-start)',
        'range & horizontal': 'auto',
      },
    },
  },
});

export const SliderGradationElement = tasty({
  qa: 'SliderGradation',
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
  qa: 'SliderGrade',
  styles: {
    display: 'grid',
    width: 'max 0',
    placeContent: 'center',
    preset: 'c2',
    color: '#dark-03',
  },
});

export const SliderControlsElement = tasty({
  qa: 'SliderControls',
  styles: {
    position: 'relative',
    height: {
      '': 'initial 8x 100%',
      horizontal: '2x',
    },
    width: {
      '': '2x',
      horizontal: '(100% - 2x)',
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
    flow: {
      '': 'column',
      inputs: 'row',
    },
  },
});
